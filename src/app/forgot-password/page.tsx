"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-[#F5F8FC] px-4 py-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[500px]">
          <div
            className="
              rounded-[22px]
              border
              border-[#D9E2EC]
              bg-white
              px-5
              py-6
              shadow-[0_18px_55px_rgba(20,50,90,0.10)]
              sm:px-8
              sm:py-7
            "
          >
            <div className="flex justify-center">
              <Image
                src="/images/Aanzara-logo5.png"
                alt="Aanzara - Shop More. Live Better."
                width={400}
                height={170}
                priority
                className="h-auto w-[170px] object-contain sm:w-[190px]"
              />
            </div>

            <div className="mt-3">
              <ForgotPasswordForm onBack={() => router.push("/login")} />
            </div>

            <div className="mt-6 border-t border-[#E3E8EF] pt-3">
              <p
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-center
                  text-[9px]
                  text-[#7C899B]
                "
              >
                <ShieldCheck size={14} className="text-[#607DB7]" />
                Your connection is{" "}
                <strong className="text-[#2848A0]">secure</strong>.
              </p>
            </div>
          </div>

          <div
            className="
              mt-4
              flex
              justify-center
              gap-4
              text-[9px]
              text-[#8995A7]
            "
          >
            <Link href="/privacy" className="hover:text-[#2848A0]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#2848A0]">
              Terms & Conditions
            </Link>
            <Link href="/contact" className="hover:text-[#2848A0]">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
