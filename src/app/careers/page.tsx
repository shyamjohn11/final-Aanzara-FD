import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Career Opportunities | Aanzara" };

export default function CareersPage() {
  return (
    <InfoStubPage
      eyebrow="About Us"
      title="Career Opportunities"
      intro="Join the team building manufacturer-direct FMCG commerce. We hire across category sourcing, warehouse operations, sales, engineering, and customer success."
      points={[
        "Open roles across operations, sales, and technology",
        "Growth-focused culture with on-the-job learning",
        "Write to our team via the Contact page to express interest",
      ]}
    />
  );
}
