import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Logistics Agreements | Aanzara" };

export default function LogisticsPage() {
  return (
    <InfoStubPage
      eyebrow="Legal Center"
      title="Logistics Agreements"
      intro="Our delivery network operates under defined service agreements covering handling, timelines, and liability across warehouse-to-store movement."
      points={[
        "Defined handling standards for FMCG goods",
        "Tracked dispatches with delivery confirmation",
        "Liability and claims process per agreement terms",
      ]}
    />
  );
}
