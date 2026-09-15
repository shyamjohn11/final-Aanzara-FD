// All order confirmation content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type OrderInfo = {
  orderNumber: string;
  orderDate: string;
  payment: string;
  invoice: string;
  status: string;
};

export const ORDER_INFO: OrderInfo = {
  orderNumber: "",
  orderDate: "",
  payment: "",
  invoice: "",
  status: "",
};

export const ORDER_PROGRESS_STEPS: string[] = [];
export const CURRENT_PROGRESS_INDEX = 0;

export type DeliveryInfo = {
  repName: string;
  shippingAddress: string;
  contact: string;
  deliveryWindow: string;
  logisticsPartner: string;
  originWarehouse: string;
};

export const DELIVERY_INFO: DeliveryInfo = {
  repName: "",
  shippingAddress: "",
  contact: "",
  deliveryWindow: "",
  logisticsPartner: "",
  originWarehouse: "",
};

export type ConfirmedOrderItem = {
  id: string;
  name: string;
  sku: string;
  qty: string;
  price: number;
  swatch: string;
};

export const ORDER_ITEMS: ConfirmedOrderItem[] = [];

export type ConfirmationOrderSummary = {
  itemsCount: number;
  moreItemsCount: number;
  subtotal: number;
};

export const CONFIRMATION_ORDER_SUMMARY: ConfirmationOrderSummary = {
  itemsCount: 0,
  moreItemsCount: 0,
  subtotal: 0,
};

export type BusinessDocument = {
  id?: string | number;
  name: string;
  meta: string;
};

export const BUSINESS_DOCUMENTS: BusinessDocument[] = [];

export type RecommendedProduct = {
  id?: string | number;
  name: string;
  price: number;
  image: string;
};

export const RECOMMENDED_PRODUCTS: RecommendedProduct[] = [];

export type GrowBusinessCard = {
  id?: string | number;
  title: string;
  desc: string;
  cta: string;
};

export const GROW_BUSINESS_CARDS: GrowBusinessCard[] = [];

export type HelpOption = {
  id?: string | number;
  title: string;
  detail: string;
};

export const HELP_OPTIONS: HelpOption[] = [];