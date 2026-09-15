// All checkout content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export const CHECKOUT_STEPS: string[] = [];
export const CURRENT_STEP_INDEX = 0;

export type SavedAddress = {
  id: string;
  label: string;
  icon: "home" | "office" | "warehouse";
  name: string;
  lines: string;
};

export const SAVED_ADDRESSES: SavedAddress[] = [];

export type DeliveryOption = {
  id: string | number;
  name: string;
  partner: string;
  detail: string;
  price: string | number;
  free?: boolean;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [];

export type CheckoutPaymentMethod = {
  id: string;
  name: string;
  detail: string;
  icon: string;
};

export const PAYMENT_METHODS: CheckoutPaymentMethod[] = [];

export type OrderItemPreview = {
  id: string | number;
  name: string;
  qty: string | number;
  price: number;
  image?: string;
};

export const ORDER_ITEMS_PREVIEW: OrderItemPreview[] = [];

export type CheckoutTrustPoint = {
  title: string;
  description: string;
};

export const CHECKOUT_TRUST_POINTS: CheckoutTrustPoint[] = [];