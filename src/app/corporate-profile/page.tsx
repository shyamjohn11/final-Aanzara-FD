import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Corporate Profile | Aanzara" };

export default function CorporateProfilePage() {
  return (
    <InfoStubPage
      eyebrow="About Us"
      title="Corporate Profile"
      intro="Aanzara Wholesale Ltd. operates a manufacturer-direct FMCG distribution network serving retail and institutional buyers across regions, backed by enterprise-grade sourcing and logistics partnerships."
      points={[
        "Registered wholesale distributor with audited supplier onboarding",
        "Regional warehouses with mill-direct dispatch options",
        "Dedicated account management for high-volume buyers",
      ]}
    />
  );
}
