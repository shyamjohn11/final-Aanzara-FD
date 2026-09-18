import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Tax & Billing Rules | Aanzara" };

export default function TaxBillingPage() {
  return (
    <InfoStubPage
      eyebrow="Legal Center"
      title="Tax and Billing Rules"
      intro="Every order ships with GST-compliant invoicing. Tax is computed per HSN slab at checkout and reflected on your invoice documents."
      points={[
        "GST invoices with HSN-wise tax breakup",
        "Input tax credit eligible documentation",
        "GST desk reachable at gst@aanzara.com",
      ]}
    />
  );
}
