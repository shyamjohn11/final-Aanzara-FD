// All cart data is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type CartDeliverTo = {
  city: string;
  region: string;
  eta: string;
};

export type CartConfig = {
  couponCode: string;
  couponDiscount: number;
  gstRate: number;
  handlingFee: number;
  deliveryFree: boolean;
  deliverTo: CartDeliverTo;
};

export const CART_CONFIG: CartConfig = {
  couponCode: "",
  couponDiscount: 0,
  gstRate: 0.18,
  handlingFee: 0,
  deliveryFree: false,
  deliverTo: {
    city: "",
    region: "",
    eta: "",
  },
};

export type CartFbtItem = {
  id: string | number;
  name: string;
  price: number;
  swatch: string;
};

export const CART_FBT: CartFbtItem[] = [];

export const CART_TRUST_ITEMS: string[] = [];

export const PAYMENT_METHODS: string[] = [];