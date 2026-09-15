// File: src/app/components/Contact/ContactHero.tsx

import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";

// =====================================================
// CONSTANTS
// =====================================================

const HERO_IMAGE = "/images/contact/contact.jpg";

const HERO_TITLE = "We're Here to Help You";

const HERO_DESCRIPTION =
  "Have a question or need assistance? Our team is ready to support your business.";

const HERO_LABEL = "CONTACT US";

// =====================================================
// VALIDATION HELPERS
// =====================================================

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidImagePath(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  const imagePath = value.trim();

  if (imagePath.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(imagePath);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// =====================================================
// VALIDATED CONTENT
// =====================================================

const safeHeroImage = isValidImagePath(HERO_IMAGE) ? HERO_IMAGE : "";

const safeHeroLabel = isValidText(HERO_LABEL)
  ? HERO_LABEL.trim()
  : "CONTACT US";

const safeHeroTitle = isValidText(HERO_TITLE)
  ? HERO_TITLE.trim()
  : "We're Here to Help You";

const safeHeroDescription = isValidText(HERO_DESCRIPTION)
  ? HERO_DESCRIPTION.trim()
  : "Have a question or need assistance? Our team is ready to support your business.";

// =====================================================
// BREADCRUMB
// =====================================================

const breadcrumbTrail = [
  {
    label: "Home",
    href: "/dashboard",
  },
  "Contact Us",
].filter((item) => {
  if (typeof item === "string") {
    return item.trim().length > 0;
  }

  return (
    typeof item === "object" &&
    item !== null &&
    "label" in item &&
    "href" in item &&
    typeof item.label === "string" &&
    item.label.trim().length > 0 &&
    typeof item.href === "string" &&
    item.href.trim().length > 0
  );
});

// =====================================================
// COMPONENT
// =====================================================

export default function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-title"
      className="relative min-h-[300px] overflow-hidden"
    >
      {safeHeroImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${safeHeroImage}")`,
          }}
        />
      )}

      {!safeHeroImage && (
        <div aria-hidden="true" className="absolute inset-0 bg-navy" />
      )}

      <div aria-hidden="true" className="absolute inset-0 bg-navy/75" />

      <div className="relative z-10 mx-auto max-w-[1360px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <span className="inline-block text-[10px] font-bold tracking-[0.18em] text-white/70 sm:text-[11px]">
          {safeHeroLabel}
        </span>

        <h1
          id="contact-hero-title"
          className="mt-2 max-w-[700px] font-sora text-[28px] font-extrabold leading-tight text-white sm:text-[36px] lg:text-[42px]"
        >
          {safeHeroTitle}
        </h1>

        <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-white/75 sm:text-[14px]">
          {safeHeroDescription}
        </p>

        {breadcrumbTrail.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mt-6 [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/50"
          >
            <Breadcrumb trail={breadcrumbTrail} />
          </nav>
        )}
      </div>
    </section>
  );
}