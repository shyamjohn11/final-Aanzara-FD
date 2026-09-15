// File: src/app/components/Contact/ContactMapSection.tsx

"use client";

import { useEffect, useState } from "react";
import { contentApi, type ContentItem } from "@/app/api/services";

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default function ContactMapSection() {
  const [officeName, setOfficeName] =
    useState<string>("Aanzara Market");
  const [officeAddress, setOfficeAddress] =
    useState<string>("");
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list(
          "contact_office",
        );

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

        if (!mounted) {
          return;
        }

        const first = rows[0];

        if (first) {
          if (isValidText(first.title)) {
            setOfficeName(first.title.trim());
          }
          if (isValidText(first.description)) {
            setOfficeAddress(
              (first.description as string).trim(),
            );
          } else {
            setOfficeAddress("");
          }
        }
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "The office location could not be loaded. Please try again later.",
        );
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

  if (error && !mapQuery) {
    return (
      <div
        role="alert"
        className="relative rounded-card overflow-hidden h-[280px] sm:h-[340px] border border-line bg-paper flex items-center justify-center px-6 text-center"
      >
        <div>
          <div className="text-[13px] font-bold text-ink">
            Office location unavailable
          </div>

          <p className="text-[11.5px] text-ink-soft mt-1">
            {error}
          </p>
        </div>
      </div>
    );
  }
  if (!mapQuery) {
    return (
      <div
        role="status"
        className="relative rounded-card overflow-hidden h-[280px] sm:h-[340px] border border-line bg-paper flex items-center justify-center px-6 text-center"
      >
        <div>
          <div className="text-[13px] font-bold text-ink">
            Office location unavailable
          </div>

          <p className="text-[11.5px] text-ink-soft mt-1">
            The office location could not be loaded. Please try again later.
          </p>
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