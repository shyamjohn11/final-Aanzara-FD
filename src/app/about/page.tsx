import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Who We Are | Aanzara" };

export default function AboutPage() {
  return (
    <InfoStubPage
      eyebrow="About Us"
      title="Who We Are"
      intro="Aanzara is a premium B2B marketplace connecting physical store retailers, restaurant chains, hotels, and corporate cafeterias directly with manufacturers for reliable, high-quality FMCG supply."
      points={[
        "Direct manufacturer supply pipelines with verified enterprise rates",
        "Built for retailers, HoReCa chains, and corporate kitchens",
        "Transparent pricing, GST-compliant billing, and dependable delivery",
      ]}
    />
  );
}
