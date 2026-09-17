import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Trust & Operations | Aanzara" };

export default function TrustPage() {
  return (
    <InfoStubPage
      eyebrow="Trust"
      title="Trust Operations"
      intro="Verified suppliers, inspected dispatches, and documented handling keep every order trustworthy — from manufacturer gate to your shelf."
      points={[
        "Audited supplier and brand onboarding",
        "Quality checks before dispatch",
        "Documented claims and credit process",
      ]}
    />
  );
}
