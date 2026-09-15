// All business solutions content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type HeroStat = {
  value: string;
  label: string;
};

export const HERO_STATS: HeroStat[] = [];

export type HeroQuickPerk = {
  title: string;
  desc: string;
};

export const HERO_QUICK_PERKS: HeroQuickPerk[] = [];

export type Solution = {
  title: string;
  desc: string;
};

export const SOLUTIONS: Solution[] = [];

export type Industry = {
  title: string;
  desc: string;
  image: string;
  cta: string;
};

export const INDUSTRIES: Industry[] = [];

export type WhyChooseItem = {
  title: string;
  desc: string;
};

export const WHY_CHOOSE: WhyChooseItem[] = [];

export type HowItWorksStep = {
  step: string | number;
  title: string;
  desc: string;
};

export const HOW_IT_WORKS: HowItWorksStep[] = [];

export const CTA_PERKS: string[] = [];

export const CTA_PHONE: string = "";