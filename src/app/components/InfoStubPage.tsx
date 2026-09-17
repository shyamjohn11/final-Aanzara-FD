import Link from "next/link";
import { ArrowLeft, BellRing, PhoneCall } from "lucide-react";

interface InfoStubPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  points: string[];
}

// Shared branded placeholder for footer routes whose full content is
// still being prepared. Keeps every footer link resolving instead of 404.
export default function InfoStubPage({
  eyebrow,
  title,
  intro,
  points,
}: InfoStubPageProps) {
  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2448A4] transition hover:opacity-75"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#E1E7F0] bg-white shadow-[0_8px_30px_rgba(15,35,75,0.08)]">
          <div className="bg-[#0B2255] px-6 py-8 sm:px-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-sora text-[22px] font-bold text-white sm:text-[26px]">
              {title}
            </h1>
          </div>

          <div className="px-6 py-8 sm:px-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1.5 text-[11px] font-semibold text-[#9A6B00]">
              <BellRing size={14} />
              Full content coming soon
            </div>

            <p className="text-[13.5px] leading-7 text-[#3C4B63]">{intro}</p>

            <ul className="mt-5 flex flex-col gap-2.5">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[13px] leading-6 text-[#3C4B63]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2448A4]"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#1769F5] px-6 text-[13px] font-semibold text-white transition hover:bg-[#0F5DDD]"
              >
                <PhoneCall size={16} />
                Contact Us
              </Link>
              <Link
                href="/help"
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE5ED] px-6 text-[13px] font-semibold text-[#33415A] transition hover:border-[#8AA9DE] hover:text-[#173B7A]"
              >
                Visit Help Center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
