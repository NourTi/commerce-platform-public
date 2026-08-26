import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ONE_YEAR_MS, COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const AUTH0_TRANSACTION_COOKIE = "auth0_customer_tx";
const AUTH0_TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

type Auth0Config = {
  appBaseUrl: string;
  clientId: string;
  clientSecret: string;
  domain: string;
  sessionSecret: string;
};

type Auth0Transaction = {
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  state: string;
};

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing ${key} configuration.`);
  return value;
}

function getAuth0Config(): Auth0Config {
  const appBaseUrl = requiredEnv("AUTH0_APP_BASE_URL").replace(/\/$/, "");
  const parsedBaseUrl = new URL(appBaseUrl);
  if (parsedBaseUrl.protocol !== "https:") {
    throw new Error("AUTH0_APP_BASE_URL must use HTTPS.");
  }

  return {
    appBaseUrl,
    clientId: requiredEnv("AUTH0_CLIENT_ID"),
    clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
    domain: requiredEnv("AUTH0_DOMAIN"),
    sessionSecret: requiredEnv("AUTH0_SESSION_SECRET"),
  };
}

function callbackUrl(config: Auth0Config) {
  return `${config.appBaseUrl}/api/auth0/callback`;
}

function codeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function signTransaction(payload: Auth0Transaction, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function parseTransaction(value: string | undefined, secret: string): Auth0Transaction | null {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Auth0Transaction;
    return parsed.state && parsed.nonce && parsed.codeVerifier && parsed.returnTo ? parsed : null;
  } catch {
    return null;
  }
}

function safeReturnTo(value: unknown) {
  if (typeof value !== "string") return "/account";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function localAuth0OpenId(subject: string) {
  return `auth0:${subject}`;
}

function queryValue(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function clearTransactionCookie(res: Response, req: Request) {
  res.clearCookie(AUTH0_TRANSACTION_COOKIE, {
    ...getSessionCookieOptions(req),
    maxAge: -1,
  });
}

export function registerAuth0CustomerRoutes(app: Express) {
  app.get("/api/auth0/login", (req, res) => {
    try {
      const config = getAuth0Config();
      const transaction: Auth0Transaction = {
        state: randomUUID(),
        nonce: randomUUID(),
        codeVerifier: randomBytes(32).toString("base64url"),
        returnTo: safeReturnTo(queryValue(req, "returnTo")),
      };
      const authorizationUrl = new URL(`https://${config.domain}/authorize`);
      authorizationUrl.search = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: callbackUrl(config),
        scope: "openid profile email",
        state: transaction.state,
        nonce: transaction.nonce,
        code_challenge: codeChallenge(transaction.codeVerifier),
        code_challenge_method: "S256",
      }).toString();

      res.cookie(AUTH0_TRANSACTION_COOKIE, signTransaction(transaction, config.sessionSecret), {
        ...getSessionCookieOptions(req),
        maxAge: AUTH0_TRANSACTION_MAX_AGE_SECONDS * 1000,
      });
      res.redirect(302, authorizationUrl.toString());
    } catch (error) {
      console.error("[Auth0] Could not start customer login", error);
      res.status(503).json({ error: "Customer sign-in is temporarily unavailable." });
    }
  });

  app.get("/api/auth0/callback", async (req, res) => {
    const config = (() => {
      try {
        return getAuth0Config();
      } catch {
        return null;
      }
    })();
    if (!config) {
      res.status(503).json({ error: "Customer sign-in is temporarily unavailable." });
      return;
    }

    const transaction = parseTransaction(
      parseCookieHeader(req.headers.cookie ?? "")[AUTH0_TRANSACTION_COOKIE],
      config.sessionSecret
    );
    const code = queryValue(req, "code");
    const state = queryValue(req, "state");
    clearTransactionCookie(res, req);

    if (!code || !state || !transaction || transaction.state !== state) {
      res.status(403).json({ error: "Invalid customer sign-in transaction." });
      return;
    }

    try {
      const tokenResponse = await fetch(`https://${config.domain}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          code_verifier: transaction.codeVerifier,
          redirect_uri: callbackUrl(config),
        }),
      });
      const tokenPayload = (await tokenResponse.json()) as { id_token?: string };
      if (!tokenResponse.ok || !tokenPayload.id_token) {
        throw new Error("Auth0 did not return an ID token.");
      }

      const jwks = createRemoteJWKSet(new URL(`https://${config.domain}/.well-known/jwks.json`));
      const { payload } = await jwtVerify(tokenPayload.id_token, jwks, {
        audience: config.clientId,
        issuer: `https://${config.domain}/`,
      });
      if (payload.nonce !== transaction.nonce || typeof payload.sub !== "string") {
        throw new Error("Auth0 token nonce or subject was invalid.");
      }
      if (typeof payload.email !== "string" || payload.email_verified !== true) {
        res.status(403).json({ error: "A verified email address is required for customer sign-in." });
        return;
      }

      const localOpenId = localAuth0OpenId(payload.sub);
      await db.upsertUser({
        openId: localOpenId,
        name: typeof payload.name === "string" ? payload.name : null,
        email: payload.email.toLowerCase(),
        loginMethod: "auth0",
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(localOpenId, {
        name: typeof payload.name === "string" ? payload.name : "",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, transaction.returnTo);
    } catch (error) {
      console.error("[Auth0] Customer callback failed", error);
      res.status(500).json({ error: "Customer sign-in could not be completed." });
    }
  });

  app.get("/api/auth0/logout", (req, res) => {
    try {
      const config = getAuth0Config();
      res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
      const logoutUrl = new URL(`https://${config.domain}/v2/logout`);
      logoutUrl.search = new URLSearchParams({
        client_id: config.clientId,
        returnTo: config.appBaseUrl,
      }).toString();
      res.redirect(302, logoutUrl.toString());
    } catch {
      res.redirect(302, "/");
    }
  });
}

export const auth0TestUtils = {
  codeChallenge,
  localAuth0OpenId,
  parseTransaction,
  safeReturnTo,
  signTransaction,
};
