// All contact content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type ContactQuickInfo = {
  title: string;
  value: string;
  sub: string;
};

export const CONTACT_QUICK_INFO: ContactQuickInfo[] = [];

export type HelpTopic = {
  title: string;
  desc: string;
};

export const HELP_TOPICS: HelpTopic[] = [];
export const SUBJECT_OPTIONS: string[] = [];

export type OfficeLocation = {
  name: string;
  address: string;
};

export const OFFICE_LOCATION: OfficeLocation = {
  name: "",
  address: "",
};