// File: src/app/components/Contact/ContactMapSection.tsx

"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@/app/api/services";
import { OFFICE_LOCATION } from "@/app/data/contact";

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default function ContactMapSection() {
  const [officeName, setOfficeName] =
    useState<string>(OFFICE_LOCATION.name || "Aanzara Market");
  const [officeAddress, setOfficeAddress] = useState<string>(
    OFFICE_LOCATION.address,
  );
  const [loading, setLoading] =
    useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const res = await contentApi.list(
          "contact_office",
        );

        const data = res.data as unknown;
        const rows: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray(
                (data as { items?: unknown })?.items,
              )
            ? ((data as { items: unknown[] }).items as unknown[])
            : Array.isArray(
                  (data as { data?: unknown })?.data,
                )
              ? ((data as { data: unknown[] }).data as unknown[])
              : [];

        if (!mounted) {
          return;
        }

        const first = rows[0] as
          | Record<string, unknown>
          | undefined;

        if (first) {
          const title =
            typeof first.title === "string"
              ? first.title.trim()
              : typeof first.Title === "string"
                ? first.Title.trim()
                : "";
          const description =
            typeof first.description === "string"
              ? first.description.trim()
              : typeof first.Description === "string"
                ? first.Description.trim()
                : "";

          if (title) {
            setOfficeName(title);
          }
          if (description) {
            setOfficeAddress(description);
          } else {
            setOfficeAddress(OFFICE_LOCATION.address);
          }
        }
      } catch {
        // Static OFFICE_LOCATION is already the default.
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const mapQuery = [officeName, officeAddress]
    .filter(isValidText)
    .join(", ");

  const query = encodeURIComponent(mapQuery);

  const embedSrc = mapQuery
    ? `https://www.google.com/maps?q=${query}&output=embed`
    : "";

  const largerMapHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${query}`
    : "";

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative rounded-card overflow-hidden h-[280px] sm:h-[340px] border border-dashed border-line bg-paper flex items-center justify-center px-6 text-center"
      >
        <div>
          <div className="text-[13px] font-bold text-ink">
            Loading office location...
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Aanzara Market office location"
      className="relative rounded-card overflow-hidden h-[280px] sm:h-[340px] border border-line"
    >
      {embedSrc && (
        <iframe
          title={`${officeName} office location`}
          src={embedSrc}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      )}

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-[240px]">
        <div className="text-[12.5px] font-bold text-ink">
          {officeName}
        </div>

        {officeAddress ? (
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            {officeAddress}
          </p>
        ) : (
          <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">
            Address information unavailable.
          </p>
        )}

        {largerMapHref && (
          <a
            href={largerMapHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View larger map for ${officeName}`}
            className="inline-block text-[11px] font-semibold text-blue hover:underline mt-2"
          >
            View larger map
          </a>
        )}
      </div>
    </section>
  );
}