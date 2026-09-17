import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Returns Policy | Aanzara" };

export default function ReturnsPolicyPage() {
  return (
    <InfoStubPage
      eyebrow="Support Desk"
      title="Returns Policy Terms"
      intro="Damaged, expired, or incorrect items are covered under our B2B returns process. Raise a request from your orders and our team will arrange inspection and resolution."
      points={[
        "Report issues within the claim window on delivered orders",
        "Photo-documented claims resolved with replacement or credit",
        "Perishable and FMCG handling as per category policy",
      ]}
    />
  );
}
