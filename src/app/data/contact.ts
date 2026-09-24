// Live contact content is fetched from the backend API.
// Fallbacks below mirror ContentSeeds in ContentModule.cs.

export type ContactQuickInfo = {
  title: string;
  value: string;
  sub: string;
};

export const CONTACT_QUICK_INFO: ContactQuickInfo[] = [
  {
    title: "Call Us",
    value: "+91 1800-309-8080",
    sub: "Mon–Sat, 9:00 AM – 7:00 PM",
  },
  {
    title: "Email Us",
    value: "support@aanzara.com",
    sub: "We reply within 24 hours",
  },
  {
    title: "Visit Us",
    value: "Mumbai, Maharashtra",
    sub: "Head office & warehouse",
  },
];

export type HelpTopic = {
  title: string;
  desc: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    title: "Order & Delivery",
    desc: "Track orders, delivery timelines, and shipping queries.",
  },
  {
    title: "Billing & Invoices",
    desc: "GST invoices, payment issues, and refund status.",
  },
  {
    title: "Returns & Refunds",
    desc: "Return requests, replacement, and refund policy.",
  },
  {
    title: "Wholesale Enquiry",
    desc: "Bulk pricing, dealer registration, and partnerships.",
  },
];

export const SUBJECT_OPTIONS: string[] = [
  "Order & Delivery",
  "Billing & Invoices",
  "Returns & Refunds",
  "Wholesale Enquiry",
  "Other",
];

export type OfficeLocation = {
  name: string;
  address: string;
};

export const OFFICE_LOCATION: OfficeLocation = {
  name: "Aanzara Market",
  address: "Andheri East, Mumbai, Maharashtra 400069",
};