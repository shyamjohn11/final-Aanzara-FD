"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-5
            flex
            items-center
            gap-2
            text-[13px]
            font-semibold
            text-[#2448A4]
            hover:opacity-75
          "
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Card */}
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
                <FileText
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
                  Terms & Conditions
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
                  Please read these terms before using Aanzara.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-7 px-6 py-8 sm:px-10">

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                1. Acceptance of Terms
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                By accessing or using Aanzara, you agree to comply
                with these Terms & Conditions. If you do not agree
                with these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                2. Account Registration
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                You may need to create an account to use certain
                features of Aanzara. You are responsible for keeping
                your account information accurate and protecting your
                login credentials.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                3. Customer and Business Accounts
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Aanzara may provide different account types,
                including customer and business accounts. Business
                accounts may have access to wholesale pricing,
                bulk-order features, and other business services.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                4. Orders
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Orders placed through Aanzara are subject to product
                availability, pricing, applicable taxes, delivery
                conditions, and confirmation by Aanzara.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                5. Wholesale Orders
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Wholesale and bulk orders may be subject to minimum
                order values, quantity requirements, business
                verification, special pricing, and applicable
                wholesale terms.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                6. Pricing and Payments
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Product prices, discounts, taxes, shipping charges,
                and other applicable fees may be displayed during
                checkout. Payments must be completed using the
                available payment methods provided by Aanzara.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                7. Delivery
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Delivery timelines may vary depending on location,
                product availability, logistics, and other factors.
                Aanzara will make reasonable efforts to deliver
                orders within the communicated timeframe.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                8. Returns and Refunds
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Returns, replacements, cancellations, and refunds are
                subject to the applicable Aanzara return and refund
                policies.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                9. Prohibited Use
              </h2>

              <ul
                className="
                  mt-3
                  list-disc
                  space-y-2
                  pl-5
                  text-[13px]
                  leading-6
                  text-[#64748B]
                "
              >
                <li>
                  Do not use the platform for unlawful activities.
                </li>
                <li>
                  Do not attempt to access another user's account.
                </li>
                <li>
                  Do not interfere with the operation of the website.
                </li>
                <li>
                  Do not provide false or misleading information.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                10. Intellectual Property
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Content available through Aanzara, including text,
                graphics, logos, designs, images, and software, may
                be protected by applicable intellectual property
                rights.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                11. Service Availability
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                We may modify, suspend, or discontinue parts of the
                service when necessary for maintenance, security,
                improvements, or other operational reasons.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                12. Changes to These Terms
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                Aanzara may update these Terms & Conditions from time
                to time. Updated terms will be published on this page.
              </p>
            </section>

            <section>
              <h2 className="!m-0 text-[18px] font-bold text-[#10265B]">
                13. Contact
              </h2>

              <p className="!m-0 mt-2 text-[13px] leading-6 text-[#64748B]">
                If you have questions about these Terms & Conditions,
                please contact Aanzara support.
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
            <p className="!m-0 text-[11px] text-[#94A3B8]">
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
            className="font-semibold text-[#2848A0]"
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