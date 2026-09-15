// All account content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type Customer = {
  name: string;
  enterprise: string;
  tier: string;
};

export const CUSTOMER: Customer = {
  name: "",
  enterprise: "",
  tier: "",
};

export type BusinessProfile = {
  enterpriseName: string;
  gstin: string;
  category: string;
  shipTo: string;
  turnover: string;
  memberSince: string;
  address: string;
};

export const BUSINESS_PROFILE: BusinessProfile = {
  enterpriseName: "",
  gstin: "",
  category: "",
  shipTo: "",
  turnover: "",
  memberSince: "",
  address: "",
};

export type StatItem = {
  label: string;
  value: string;
  note: string;
  noteTone?: string;
  icon: "package" | "truck" | "piggy" | "user";
};

export const STATS: StatItem[] = [];

export type RecentOrder = {
  id: string;
  date: string;
  items: string;
  status: "Confirmed" | "Shipped" | "Delivered";
  amount: string;
};

export const RECENT_ORDERS: RecentOrder[] = [];

export type RecentInvoice = {
  id: string;
  meta: string;
  amount: string;
};

export const RECENT_INVOICES: RecentInvoice[] = [];

export type BulkQuotation = {
  id: string;
  meta: string;
  status: "Pending" | "Approved" | "Closed";
};

export const BULK_QUOTATIONS: BulkQuotation[] = [];

export type WishlistItem = {
  name: string;
  pack: string;
  price: string;
};

export const WISHLIST_ITEMS: WishlistItem[] = [];

export type AccountSavedAddress = {
  label: string;
  lines: string[];
  primary?: boolean;
};

export const SAVED_ADDRESSES: AccountSavedAddress[] = [];

export type OrderStep = {
  label: string;
  time: string;
  state: "done" | "pending";
};

export type CurrentOrder = {
  id: string;
  expected: string;
  steps: OrderStep[];
};

export const CURRENT_ORDER: CurrentOrder = {
  id: "",
  expected: "",
  steps: [],
};