import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Delivery Areas | Aanzara" };

export default function DeliveryAreasPage() {
  return (
    <InfoStubPage
      eyebrow="Support Desk"
      title="Delivery Areas Covered"
      intro="We dispatch from regional warehouses to retail stores, restaurants, and institutions. Coverage is expanding — check with our team for your pincode."
      points={[
        "Metro and tier-2 city coverage from regional hubs",
        "Scheduled B2B delivery slots for repeat buyers",
        "Mill-direct dispatch available on qualifying orders",
      ]}
    />
  );
}
