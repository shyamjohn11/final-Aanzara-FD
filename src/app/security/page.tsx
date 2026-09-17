import InfoStubPage from "@/app/components/InfoStubPage";

export const metadata = { title: "Security Architecture | Aanzara" };

export default function SecurityPage() {
  return (
    <InfoStubPage
      eyebrow="Trust"
      title="Security Architecture"
      intro="Account credentials are stored as salted hashes, sessions are device-scoped with refresh rotation, and every API call is authenticated and permission-checked."
      points={[
        "Salted passphrase hashing — raw credentials never stored",
        "Short-lived access tokens with revocable sessions",
        "Role-based permissions enforced on every endpoint",
      ]}
    />
  );
}
