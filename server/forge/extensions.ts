import type { PriceTrace, ProductBlueprintDefinition, SelectionMap } from "@shared/forge";

export type ForgeExtensionManifest = {
  id: string;
  version: string;
  forgeCompatibility: string;
  displayName: string;
  contributes: {
    blueprintIds?: string[];
    eventTypes?: string[];
    connectorIds?: string[];
  };
};

export type ProductionPassportPayload = {
  blueprintId: string;
  configurationId: string;
  selections: SelectionMap;
  rulesVersion: string;
  priceTrace: PriceTrace;
  approvedQuote: string;
  releasedAt: string;
};

export type ProductionConnectorReceipt = {
  connectorId: string;
  externalReference: string;
  idempotencyKey: string;
  acceptedAt: string;
};

export interface ProductionConnector {
  readonly manifest: ForgeExtensionManifest;
  deliver(event: {
    eventId: string;
    idempotencyKey: string;
    payload: ProductionPassportPayload;
  }): Promise<ProductionConnectorReceipt>;
}

export function buildProductionPassportSpecification(input: {
  blueprint: ProductBlueprintDefinition;
  configurationId: string;
  selections: SelectionMap;
  priceTrace: PriceTrace;
  approvedQuote: string;
  releasedAt: string;
}): ProductionPassportPayload {
  return structuredClone({
    blueprintId: input.blueprint.id,
    configurationId: input.configurationId,
    selections: input.selections,
    rulesVersion: input.priceTrace.rulesVersion,
    priceTrace: input.priceTrace,
    approvedQuote: input.approvedQuote,
    releasedAt: input.releasedAt,
  });
}

export const mockProductionConnector: ProductionConnector = {
  manifest: {
    id: "@forge/mock-production-connector",
    version: "0.1.0",
    forgeCompatibility: "^0.1.0",
    displayName: "Mock Production Connector",
    contributes: {
      eventTypes: ["production.passport.released"],
      connectorIds: ["mock-production"],
    },
  },
  async deliver(event) {
    return {
      connectorId: "mock-production",
      externalReference: `MRP-MOCK-${event.payload.configurationId.toUpperCase()}`,
      idempotencyKey: event.idempotencyKey,
      acceptedAt: new Date().toISOString(),
    };
  },
};
