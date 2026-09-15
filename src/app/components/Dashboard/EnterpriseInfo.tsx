// File: app/components/Dashboard/EnterpriseInfo.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Download,
} from "lucide-react";

import {
  ENTERPRISE_INFO,
  ENTERPRISE_DOCS,
} from "@/app/data/productDetail";
import { contentApi, type ContentItem } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type EnterpriseInfoItem = {
  title: string;
  desc: string;
};

type EnterpriseDocument = {
  name: string;
  meta: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function isValidText(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function normalizeInfoItem(
  item: unknown
): EnterpriseInfoItem | null {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const value =
    item as Partial<EnterpriseInfoItem>;

  if (
    !isValidText(value.title) ||
    !isValidText(value.desc)
  ) {
    return null;
  }

  return {
    title: value.title.trim(),
    desc: value.desc.trim(),
  };
}

function normalizeDocument(
  doc: unknown
): EnterpriseDocument | null {
  if (
    !doc ||
    typeof doc !== "object"
  ) {
    return null;
  }

  const value =
    doc as Partial<EnterpriseDocument>;

  if (
    !isValidText(value.name) ||
    !isValidText(value.meta)
  ) {
    return null;
  }

  return {
    name: value.name.trim(),
    meta: value.meta.trim(),
  };
}

function mapContentToInfo(row: ContentItem): EnterpriseInfoItem | null {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const desc =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!title || !desc) return null;
  return { title, desc };
}

function mapContentToDoc(row: ContentItem): EnterpriseDocument | null {
  const name =
    typeof row.title === "string" ? row.title.trim() : "";
  const meta =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!name || !meta) return null;
  return { name, meta };
}

function unwrapContent(data: unknown): ContentItem[] {
  if (Array.isArray(data)) return data as ContentItem[];
  const items = (data as any)?.items;
  if (Array.isArray(items)) return items as ContentItem[];
  return [];
}

/* ============================================================
   COMPONENT
============================================================ */

export default function EnterpriseInfo() {
  const [liveInfo, setLiveInfo] = useState<EnterpriseInfoItem[]>([]);
  const [liveDocs, setLiveDocs] = useState<EnterpriseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [infoRes, docsRes] = await Promise.all([
          contentApi.list("enterprise_info"),
          contentApi.list("enterprise_docs"),
        ]);
        if (!cancelled) {
          setLiveInfo(
            unwrapContent(infoRes.data)
              .map(mapContentToInfo)
              .filter(
                (i): i is EnterpriseInfoItem => i !== null
              )
          );
          setLiveDocs(
            unwrapContent(docsRes.data)
              .map(mapContentToDoc)
              .filter(
                (d): d is EnterpriseDocument => d !== null
              )
          );
        }
      } catch {
        if (!cancelled) {
          setLiveInfo([]);
          setLiveDocs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     SAFE DATA
  ========================================================== */

  const combinedInfo: unknown[] = Array.isArray(ENTERPRISE_INFO)
    ? [...ENTERPRISE_INFO, ...liveInfo]
    : [...liveInfo];

  const combinedDocs: unknown[] = Array.isArray(ENTERPRISE_DOCS)
    ? [...ENTERPRISE_DOCS, ...liveDocs]
    : [...liveDocs];

  const safeEnterpriseInfo: EnterpriseInfoItem[] = combinedInfo
    .map(normalizeInfoItem)
    .filter(
      (
        item
      ): item is EnterpriseInfoItem =>
        item !== null
    );

  const safeEnterpriseDocs: EnterpriseDocument[] = combinedDocs
    .map(normalizeDocument)
    .filter(
      (
        doc
      ): doc is EnterpriseDocument =>
        doc !== null
    );

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleCorporateContact = () => {
    /*
     * Add your corporate account manager flow here.
     *
     * Example:
     * router.push("/contact?type=corporate");
     */
    console.log(
      "Contact Corporate Account Manager"
    );
  };

  const handleDocumentDownload = (
    document: EnterpriseDocument
  ) => {
    /*
     * Add actual document download logic here.
     *
     * Example:
     * window.open(document.url, "_blank");
     */

    console.log(
      "Download document:",
      document.name
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-labelledby="enterprise-info-title"
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          mb-1
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <h2
            id="enterprise-info-title"
            className="
              font-sora
              font-bold
              text-[15.5px]
              text-ink
            "
          >
            Enterprise & Distributor Information
          </h2>

          <p
            className="
              text-[12px]
              text-ink-soft
              mt-0.5
              leading-relaxed
            "
          >
            Get bulk dealer pricing, dealer margins,
            and bulk requirement rates.
          </p>
        </div>

        {/* ==================================================
            CORPORATE CONTACT
        ================================================== */}

        <button
          type="button"
          onClick={handleCorporateContact}
          aria-label="Contact Corporate Account Manager"
          className="
            flex
            items-center
            justify-center
            gap-2
            bg-blue-deep
            hover:bg-navy
            transition-colors
            text-white
            text-[11.5px]
            font-bold
            px-4
            py-2.5
            rounded-lg
            shrink-0
            focus:outline-none
            focus:ring-2
            focus:ring-blue/30
            focus:ring-offset-2
          "
        >
          <Building2
            size={14}
            aria-hidden="true"
          />

          <span>
            Contact Corporate Account Manager
          </span>
        </button>
      </div>

      {/* ======================================================
          ENTERPRISE INFORMATION
      ====================================================== */}

      {loading && safeEnterpriseInfo.length === 0 ? (
        <div
          role="status"
          className="
            mt-4
            rounded-lg
            border
            border-line
            bg-paper
            px-4
            py-3
            text-center
            text-[11.5px]
            text-ink-soft
          "
        >
          Loading enterprise information…
        </div>
      ) : safeEnterpriseInfo.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-3
            mt-4
          "
        >
          {safeEnterpriseInfo.map(
            (item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="
                  bg-paper
                  border
                  border-line
                  rounded-lg
                  p-3.5
                "
              >
                <FileText
                  size={16}
                  aria-hidden="true"
                  className="
                    text-blue
                    mb-2
                  "
                />

                <h3
                  className="
                    text-[12.5px]
                    font-bold
                    text-ink
                    mb-1
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    text-[11px]
                    text-ink-soft
                    leading-relaxed
                  "
                >
                  {item.desc}
                </p>
              </article>
            )
          )}
        </div>
      ) : (
        <div
          role="status"
          className="
            mt-4
            rounded-lg
            border
            border-line
            bg-paper
            px-4
            py-3
            text-center
            text-[11.5px]
            text-ink-soft
          "
        >
          Enterprise information is currently
          unavailable.
        </div>
      )}

      {/* ======================================================
          DOCUMENTS TITLE
      ====================================================== */}

      {safeEnterpriseDocs.length > 0 && (
        <>
          <div
            className="
              text-[11px]
              font-semibold
              text-ink-faint
              tracking-wide
              mt-5
              mb-2
            "
          >
            DOWNLOADABLE DOCUMENTS
          </div>

          {/* ==================================================
              DOCUMENT LIST
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-3
            "
          >
            {safeEnterpriseDocs.map(
              (doc, index) => (
                <button
                  key={`${doc.name}-${index}`}
                  type="button"
                  onClick={() =>
                    handleDocumentDownload(
                      doc
                    )
                  }
                  aria-label={`Download ${doc.name}`}
                  className="
                    flex
                    items-center
                    gap-2.5
                    border
                    border-line
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    transition-colors
                    hover:border-blue
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue/30
                    focus:ring-offset-1
                  "
                >
                  {/* DOCUMENT ICON */}

                  <span
                    aria-hidden="true"
                    className="
                      w-8
                      h-8
                      rounded-md
                      bg-blue/10
                      text-blue
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <FileText size={14} />
                  </span>

                  {/* DOCUMENT DETAILS */}

                  <span
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <span
                      title={doc.name}
                      className="
                        block
                        text-[11.5px]
                        font-semibold
                        text-ink
                        truncate
                      "
                    >
                      {doc.name}
                    </span>

                    <span
                      className="
                        block
                        text-[10.5px]
                        text-ink-faint
                        truncate
                      "
                    >
                      {doc.meta}
                    </span>
                  </span>

                  {/* DOWNLOAD ICON */}

                  <Download
                    size={14}
                    aria-hidden="true"
                    className="
                      text-ink-faint
                      shrink-0
                    "
                  />
                </button>
              )
            )}
          </div>
        </>
      )}
    </section>
  );
}
