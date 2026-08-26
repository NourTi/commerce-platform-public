import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  configurationVersions,
  integrationOutbox,
  productBlueprints,
  productionPassports,
  quotes,
} from "../../drizzle/schema";
import {
  type ProductBlueprintDefinition,
  type SelectionMap,
  productBlueprintDefinitionSchema,
  referenceFurnitureBlueprint,
} from "@shared/forge";
import { getDb } from "../db";
import { evaluateConfiguration } from "./domain";
import { buildProductionPassportSpecification, mockProductionConnector, type ProductionPassportPayload } from "./extensions";

function nowReference(prefix: string) {
  return `${prefix}-${new Date().getUTCFullYear()}-${nanoid(6).toUpperCase()}`;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Forge Commerce database is unavailable.");
  return db;
}

export async function initializeReferenceBlueprint(ownerId: number) {
  const db = await requireDb();
  const existing = await db
    .select()
    .from(productBlueprints)
    .where(eq(productBlueprints.id, referenceFurnitureBlueprint.id))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(productBlueprints).values({
    id: referenceFurnitureBlueprint.id,
    slug: referenceFurnitureBlueprint.slug,
    name: referenceFurnitureBlueprint.name,
    summary: referenceFurnitureBlueprint.summary,
    schemaVersion: referenceFurnitureBlueprint.schemaVersion,
    definition: referenceFurnitureBlueprint,
    status: "PUBLISHED",
    ownerId,
  });

  const created = await db
    .select()
    .from(productBlueprints)
    .where(eq(productBlueprints.id, referenceFurnitureBlueprint.id))
    .limit(1);
  return created[0];
}

export async function saveConfiguration(ownerId: number, selections: SelectionMap) {
  const db = await requireDb();
  const blueprintRows = await db
    .select()
    .from(productBlueprints)
    .where(
      and(
        eq(productBlueprints.id, referenceFurnitureBlueprint.id),
        eq(productBlueprints.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  const blueprintRow = blueprintRows[0];
  if (!blueprintRow) {
    throw new Error("Reference blueprint is not initialized. An administrator must initialize it first.");
  }

  const definition = productBlueprintDefinitionSchema.parse(
    blueprintRow.definition as ProductBlueprintDefinition,
  );
  const evaluation = evaluateConfiguration(definition, selections);
  if (!evaluation.isValid || !evaluation.priceTrace || !evaluation.fingerprint) return evaluation;

  const configurationId = `cfg_${nanoid(16)}`;
  await db.insert(configurationVersions).values({
    id: configurationId,
    blueprintId: definition.id,
    ownerId,
    status: "DRAFT",
    selections: evaluation.resolvedSelections,
    validationResult: { issues: evaluation.issues, isValid: evaluation.isValid },
    priceTrace: evaluation.priceTrace,
    fingerprint: evaluation.fingerprint,
    totalCents: evaluation.priceTrace.totalCents,
    depositCents: evaluation.priceTrace.depositCents,
    leadTimeDays: evaluation.priceTrace.leadTimeDays,
    rulesVersion: evaluation.priceTrace.rulesVersion,
  });

  return { ...evaluation, configurationId };
}

export async function issueQuote(ownerId: number, configurationId: string) {
  const db = await requireDb();
  const configuration = await db
    .select()
    .from(configurationVersions)
    .where(and(eq(configurationVersions.id, configurationId), eq(configurationVersions.ownerId, ownerId)))
    .limit(1);
  const record = configuration[0];
  if (!record) throw new Error("Configuration not found.");

  const quoteId = `quo_${nanoid(16)}`;
  const reference = nowReference("FQ");
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.insert(quotes).values({
    id: quoteId,
    configurationId,
    ownerId,
    reference,
    status: "SENT",
    totalCents: record.totalCents,
    depositCents: record.depositCents,
    validUntil,
  });
  await db
    .update(configurationVersions)
    .set({ status: "QUOTED" })
    .where(eq(configurationVersions.id, configurationId));

  return { id: quoteId, reference, status: "SENT" as const, validUntil };
}

export async function acceptQuote(ownerId: number, quoteId: string) {
  const db = await requireDb();
  const quoteRows = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.ownerId, ownerId)))
    .limit(1);
  const quote = quoteRows[0];
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "SENT") throw new Error("Only a sent quote can be accepted.");

  await db
    .update(quotes)
    .set({ status: "ACCEPTED", acceptedAt: new Date() })
    .where(eq(quotes.id, quoteId));
  await db
    .update(configurationVersions)
    .set({ status: "ACCEPTED" })
    .where(eq(configurationVersions.id, quote.configurationId));

  return { id: quoteId, status: "ACCEPTED" as const };
}

export async function releaseProductionPassport(ownerId: number, configurationId: string) {
  const db = await requireDb();
  const configurationRows = await db
    .select()
    .from(configurationVersions)
    .where(and(eq(configurationVersions.id, configurationId), eq(configurationVersions.ownerId, ownerId)))
    .limit(1);
  const configuration = configurationRows[0];
  if (!configuration) throw new Error("Configuration not found.");
  if (configuration.status !== "ACCEPTED") {
    throw new Error("An accepted quote is required before production release.");
  }

  const existing = await db
    .select()
    .from(productionPassports)
    .where(eq(productionPassports.configurationId, configurationId))
    .limit(1);
  if (existing[0]) return existing[0];

  const quoteRows = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.configurationId, configurationId), eq(quotes.status, "ACCEPTED")))
    .limit(1);
  const quote = quoteRows[0];
  if (!quote) throw new Error("Accepted quote not found.");

  const passportId = `pp_${nanoid(16)}`;
  const passportNumber = nowReference("PP");
  const idempotencyKey = `production-passport:${configuration.id}:${configuration.fingerprint}`;
  const blueprintRows = await db
    .select()
    .from(productBlueprints)
    .where(eq(productBlueprints.id, configuration.blueprintId))
    .limit(1);
  const blueprint = blueprintRows[0];
  if (!blueprint) throw new Error("Blueprint not found for configuration.");
  const releasedAt = new Date();
  const specification = buildProductionPassportSpecification({
    blueprint: productBlueprintDefinitionSchema.parse(blueprint.definition as ProductBlueprintDefinition),
    configurationId: configuration.id,
    selections: structuredClone(configuration.selections),
    priceTrace: structuredClone(configuration.priceTrace),
    approvedQuote: quote.reference,
    releasedAt: releasedAt.toISOString(),
  });

  await db.transaction(async tx => {
    await tx.insert(productionPassports).values({
      id: passportId,
      configurationId,
      quoteId: quote.id,
      ownerId,
      passportNumber,
      status: "RELEASED",
      specification,
      idempotencyKey,
      releasedAt,
    });
    await tx.insert(integrationOutbox).values({
      id: `evt_${nanoid(16)}`,
      aggregateType: "production_passport",
      aggregateId: passportId,
      eventType: "production.passport.released",
      payload: specification,
      idempotencyKey,
      status: "PENDING",
    });
    await tx
      .update(configurationVersions)
      .set({ status: "PRODUCTION_RELEASED" })
      .where(eq(configurationVersions.id, configurationId));
  });

  return { id: passportId, passportNumber, status: "RELEASED" as const, idempotencyKey };
}

export async function getWorkspace(ownerId: number) {
  const db = await requireDb();
  const [configurations, quoteRows, passports, outbox] = await Promise.all([
    db
      .select()
      .from(configurationVersions)
      .where(eq(configurationVersions.ownerId, ownerId))
      .orderBy(desc(configurationVersions.createdAt))
      .limit(8),
    db.select().from(quotes).where(eq(quotes.ownerId, ownerId)).orderBy(desc(quotes.createdAt)).limit(8),
    db
      .select()
      .from(productionPassports)
      .where(eq(productionPassports.ownerId, ownerId))
      .orderBy(desc(productionPassports.createdAt))
      .limit(8),
    db
      .select()
      .from(integrationOutbox)
      .orderBy(desc(integrationOutbox.createdAt))
      .limit(8),
  ]);

  return { configurations, quotes: quoteRows, passports, outbox };
}

export async function deliverNextMockProductionEvent(ownerId: number) {
  const db = await requireDb();
  const rows = await db
    .select({ outbox: integrationOutbox, passport: productionPassports })
    .from(integrationOutbox)
    .innerJoin(productionPassports, eq(integrationOutbox.aggregateId, productionPassports.id))
    .where(
      and(
        eq(integrationOutbox.eventType, "production.passport.released"),
        eq(integrationOutbox.status, "PENDING"),
        eq(productionPassports.ownerId, ownerId),
      ),
    )
    .orderBy(integrationOutbox.createdAt)
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const receipt = await mockProductionConnector.deliver({
    eventId: row.outbox.id,
    idempotencyKey: row.outbox.idempotencyKey,
    payload: row.outbox.payload as ProductionPassportPayload,
  });

  await db.transaction(async tx => {
    await tx
      .update(integrationOutbox)
      .set({ status: "DELIVERED", attemptCount: row.outbox.attemptCount + 1, deliveredAt: new Date() })
      .where(and(eq(integrationOutbox.id, row.outbox.id), eq(integrationOutbox.status, "PENDING")));
    await tx
      .update(productionPassports)
      .set({ status: "IN_PROGRESS" })
      .where(eq(productionPassports.id, row.passport.id));
  });

  return receipt;
}
