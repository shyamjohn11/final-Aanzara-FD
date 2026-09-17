import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "API Integration | Aanzara" };

export default function ApiIntegrationPage() {
  return (
    <InfoStubPage
      eyebrow="Support Desk"
      title="API Integration"
      intro="Connect your ERP, POS, or ordering system to Aanzara for catalog sync, ordering, and invoice reconciliation through our integration program."
      points={[
        "Catalog, order, and invoice data exchange",
        "Sandbox access for development and testing",
        "Integration support from our technology team",
      ]}
    />
  );
}
