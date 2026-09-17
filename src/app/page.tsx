import { redirect } from "next/navigation";

// Storefront home lives at /dashboard (role homes + login bounce are
// handled by middleware, preserving ?redirect= for post-login return).
export default function Home() {
  redirect("/dashboard");
}