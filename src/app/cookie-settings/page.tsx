import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Cookie Settings | Aanzara" };

export default function CookieSettingsPage() {
  return (
    <InfoStubPage
      eyebrow="Trust"
      title="Cookie Settings"
      intro="Aanzara uses strictly necessary cookies to keep you signed in and remember your cart. Manage your preferences here once granular controls ship."
      points={[
        "Essential session cookies required for sign-in",
        "No advertising trackers on the storefront",
        "Clear cookies anytime from your browser settings",
      ]}
    />
  );
}
