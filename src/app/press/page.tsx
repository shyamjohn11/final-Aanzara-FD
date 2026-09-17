import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Press Newsroom | Aanzara" };

export default function PressPage() {
  return (
    <InfoStubPage
      eyebrow="About Us"
      title="Press Newsroom"
      intro="Announcements, milestones, and media resources from Aanzara. For press queries, partnerships, or interview requests, reach our corporate communications desk."
      points={[
        "Company announcements and expansion updates",
        "Brand assets and media kit on request",
        "Press contact available through the Contact page",
      ]}
    />
  );
}
