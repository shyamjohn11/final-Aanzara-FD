// All alert content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type AlertType = "order" | "offer" | "delivery" | "payment" | "system";

export type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
};

export const ALERTS: AlertItem[] = [];