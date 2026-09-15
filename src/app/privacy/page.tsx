"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 lg:px-8">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-5
            flex
            items-center
            gap-2
            !text-[#2448A4]
            text-[13px]
            font-semibold
            transition
            hover:opacity-75
          "
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Main Card */}
        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[#E1E7F0]
            bg-white
            shadow-[0_8px_30px_rgba(15,35,75,0.08)]
          "
        >
          {/* Header */}
          <div
            className="
              bg-[#0B2255]
              px-6
              py-8
              sm:px-10
              sm:py-10
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                "
              >
                <ShieldCheck
                  size={26}
                  className="text-white"
                />
              </div>

              <div>
                <h1
                  className="
                    !m-0
                    !text-white
                    text-[26px]
                    font-bold
                    sm:text-[32px]
                  "
                >
                  Privacy Policy
                </h1>

                <p
                  className="
                    !m-0
                    mt-1
                    !text-white/70
                    text-[12px]
                    sm:text-[13px]
                  "
                >
                  Your privacy and security are important to us.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-7 px-6 py-8 sm:px-10">

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                1. Introduction
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                Welcome to Aanzara. We respect your privacy and are
                committed to protecting your personal information when
                you use our website, application, and services.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                2. Information We Collect
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                We may collect information such as your name, email
                address, mobile number, delivery address, billing
                information, order details, and account information
                when you use our services.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                3. How We Use Your Information
              </h2>

              <ul
                className="
                  mt-3
                  list-disc
                  space-y-2
                  pl-5
                  !text-[#64748B]
                  text-[13px]
                  leading-6
                "
              >
                <li>To create and manage your account.</li>
                <li>To process and deliver your orders.</li>
                <li>To process payments and invoices.</li>
                <li>To provide customer support.</li>
                <li>To improve our products and services.</li>
                <li>To send important account and order updates.</li>
              </ul>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                4. Payment Security
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                Payment information is handled through secure payment
                services. We take reasonable measures to protect your
                payment and transaction information.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                5. Data Security
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                We use appropriate technical and organizational
                measures to protect your personal information from
                unauthorized access, alteration, disclosure, or loss.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                6. Cookies
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                Our website may use cookies and similar technologies
                to improve your experience, remember preferences, and
                understand how our services are used.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                7. Third-Party Services
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                We may use trusted third-party services for payments,
                analytics, delivery, communication, and other
                business operations. These providers may process
                information as required to provide their services.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                8. Your Rights
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                You may contact us regarding your personal information,
                account details, or privacy-related concerns. We will
                review and respond to valid requests in accordance
                with applicable requirements.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                9. Policy Updates
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                We may update this Privacy Policy from time to time.
                Any changes will be reflected on this page.
              </p>
            </section>

            <section>
              <h2 className="!m-0 !text-[#10265B] text-[18px] font-bold">
                10. Contact Us
              </h2>

              <p className="!m-0 mt-2 !text-[#64748B] text-[13px] leading-6">
                If you have questions about this Privacy Policy or
                how your information is handled, please contact our
                support team.
              </p>
            </section>

          </div>

          {/* Bottom */}
          <div
            className="
              border-t
              border-[#E5E7EB]
              bg-[#F8FAFC]
              px-6
              py-5
              text-center
              sm:px-10
            "
          >
            <p className="!m-0 !text-[#94A3B8] text-[11px]">
              Last updated: September 2026
            </p>
          </div>
        </section>

        {/* Footer Links */}
        <div
          className="
            mt-5
            flex
            flex-wrap
            justify-center
            gap-x-5
            gap-y-2
            text-center
            text-[11px]
            text-[#8995A7]
          "
        >
          <button
            type="button"
            onClick={() => router.push("/privacy")}
            className="hover:text-[#2848A0]"
          >
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => router.push("/terms")}
            className="hover:text-[#2848A0]"
          >
            Terms & Conditions
          </button>

          <button
            type="button"
            onClick={() => router.push("/help")}
            className="hover:text-[#2848A0]"
          >
            Help Center
          </button>

          <button
            type="button"
            onClick={() => router.push("/contact")}
            className="hover:text-[#2848A0]"
          >
            Contact Support
          </button>
        </div>

      </div>
    </main>
  );
}