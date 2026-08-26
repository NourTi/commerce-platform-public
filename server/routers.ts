import { selectionMapSchema, referenceFurnitureBlueprint } from "@shared/forge";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { evaluateConfiguration } from "./forge/domain";
import { acceptQuote, deliverNextMockProductionEvent, getWorkspace, initializeReferenceBlueprint, issueQuote, releaseProductionPassport, saveConfiguration } from "./forge/service";
import { commerceRouter } from "./commerce/router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  legacyMadeToOrder: router({
    reference: publicProcedure.query(() => referenceFurnitureBlueprint),
    evaluateReference: publicProcedure.input(z.object({ selections: selectionMapSchema })).query(({ input }) => evaluateConfiguration(referenceFurnitureBlueprint, input.selections)),
    initializeReference: adminProcedure.mutation(({ ctx }) => initializeReferenceBlueprint(ctx.user.id)),
    workspace: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user.id)),
    saveConfiguration: protectedProcedure.input(z.object({ selections: selectionMapSchema })).mutation(({ ctx, input }) => saveConfiguration(ctx.user.id, input.selections)),
    issueQuote: protectedProcedure.input(z.object({ configurationId: z.string().min(1) })).mutation(({ ctx, input }) => issueQuote(ctx.user.id, input.configurationId)),
    acceptQuote: protectedProcedure.input(z.object({ quoteId: z.string().min(1) })).mutation(({ ctx, input }) => acceptQuote(ctx.user.id, input.quoteId)),
    releaseProductionPassport: protectedProcedure.input(z.object({ configurationId: z.string().min(1) })).mutation(({ ctx, input }) => releaseProductionPassport(ctx.user.id, input.configurationId)),
    deliverNextMockProductionEvent: protectedProcedure.mutation(({ ctx }) => deliverNextMockProductionEvent(ctx.user.id)),
  }),
  commerce: commerceRouter,
});

export type AppRouter = typeof appRouter;
