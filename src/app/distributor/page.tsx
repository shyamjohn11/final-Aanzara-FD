import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Become a Distributor | Aanzara" };

export default function DistributorPage() {
  return (
    <InfoStubPage
      eyebrow="Support Desk"
      title="Become a Distributor"
      intro="Partner with Aanzara to distribute FMCG brands in your territory. Distributors get dealer pricing, margin support, and logistics backing."
      points={[
        "Territory-based distribution opportunities",
        "Dealer margins with volume-linked incentives",
        "Apply through the Contact page with your business details",
      ]}
    />
  );
}
