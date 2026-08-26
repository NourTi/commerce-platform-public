export type CheckoutDeliveryForm = {
  firstName: string;
  lastName: string;
  line1: string;
  city: string;
  region: string;
  phone: string;
};

export type SavedCheckoutAddress = Omit<CheckoutDeliveryForm, "region" | "phone"> & {
  id: string;
  label: string | null;
  region: string | null;
  phone: string | null;
};

export function applySavedAddressToCheckout(
  form: CheckoutDeliveryForm,
  address: SavedCheckoutAddress,
): CheckoutDeliveryForm {
  return {
    ...form,
    firstName: address.firstName,
    lastName: address.lastName,
    line1: address.line1,
    city: address.city,
    region: address.region ?? "",
    phone: address.phone ?? "",
  };
}
