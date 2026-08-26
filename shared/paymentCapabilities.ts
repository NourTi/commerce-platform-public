export const paymentProviderKeys = ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CHARGILY_PAY", "MANUAL"] as const;
export type PaymentProviderKey = typeof paymentProviderKeys[number];

export type PaymentCapability = {
  provider: PaymentProviderKey;
  displayName: string;
  defaultStatus: "DISABLED" | "ACTIVE";
  merchantEditable: boolean;
  merchantOwnedFunds: boolean;
  requiresExternalCredentials: boolean;
  checkoutMode: "MANUAL_REVIEW" | "WEBHOOK_ONLY" | "INTERNAL";
  merchantHint: string;
  defaultConfiguration: Record<string, unknown>;
};

export const algeriaFirstPaymentCapabilities: readonly PaymentCapability[] = [
  { provider: "CASH_ON_DELIVERY", displayName: "Cash on delivery", defaultStatus: "ACTIVE", merchantEditable: true, merchantOwnedFunds: true, requiresExternalCredentials: false, checkoutMode: "MANUAL_REVIEW", merchantHint: "Confirm, dispatch, collect, then record merchant settlement.", defaultConfiguration: { confirmationRequired: true, settlementMode: "merchant-managed" } },
  { provider: "BANK_TRANSFER", displayName: "Bank transfer", defaultStatus: "DISABLED", merchantEditable: true, merchantOwnedFunds: true, requiresExternalCredentials: false, checkoutMode: "MANUAL_REVIEW", merchantHint: "Customer reference is submitted; merchant approves before fulfilment.", defaultConfiguration: { approvalRequired: true, settlementMode: "merchant-managed" } },
  { provider: "CHARGILY_PAY", displayName: "Chargily Pay", defaultStatus: "DISABLED", merchantEditable: true, merchantOwnedFunds: true, requiresExternalCredentials: true, checkoutMode: "WEBHOOK_ONLY", merchantHint: "Disabled until merchant credentials and a hosted-checkout connector are configured.", defaultConfiguration: { locale: "ar", feeAllocation: "merchant", activation: "requires-merchant-credentials-and-hosted-checkout-connector" } },
  { provider: "MANUAL", displayName: "Manual record", defaultStatus: "DISABLED", merchantEditable: false, merchantOwnedFunds: true, requiresExternalCredentials: false, checkoutMode: "INTERNAL", merchantHint: "Internal record only.", defaultConfiguration: {} },
];

export function getPaymentCapability(provider: PaymentProviderKey) {
  const capability = algeriaFirstPaymentCapabilities.find(candidate => candidate.provider === provider);
  if (!capability) throw new Error("Unsupported payment provider.");
  return capability;
}

export function validateMerchantPaymentProviderUpdate(provider: PaymentProviderKey, status: "DISABLED" | "TEST" | "ACTIVE" | "ERROR") {
  const capability = getPaymentCapability(provider);
  if (!capability.merchantEditable) throw new Error("This payment record is internal and cannot be enabled for checkout.");
  if (capability.requiresExternalCredentials && status !== "DISABLED") throw new Error(`${capability.displayName} remains disabled until a merchant-configured hosted-checkout connector and credentials are available.`);
  return capability;
}

export function createDefaultPaymentProviderRows(storeId: string, createId: () => string) {
  return algeriaFirstPaymentCapabilities.filter(capability => capability.merchantEditable).map(capability => ({
    id: createId(),
    storeId,
    provider: capability.provider,
    status: capability.defaultStatus,
    displayName: capability.displayName,
    configuration: capability.defaultConfiguration,
  }));
}
