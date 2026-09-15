"use client";

import { useEffect, useState } from "react";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type BusinessDocument = {
  id: string | number;
  name: string;
  meta: string;
};

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidId(
  value: unknown,
): value is string | number {
  return (
    (typeof value === "string" ||
      typeof value === "number") &&
    String(value).trim().length > 0
  );
}

function isValidBusinessDocument(
  doc: unknown,
): doc is BusinessDocument {
  if (
    !doc ||
    typeof doc !== "object" ||
    Array.isArray(doc)
  ) {
    return false;
  }

  const item =
    doc as Partial<BusinessDocument>;

  return (
    isValidId(item.id) &&
    isValidText(item.name) &&
    isValidText(item.meta)
  );
}

/* --------------------------------
 * Safe Documents
 * -------------------------------- */

function toBusinessDocument(
  row: ContentItem,
  index: number,
): unknown {
  return {
    id: (row as ContentItem).id ?? String(index),
    name: row.title,
    meta: row.description ?? "",
  };
}

function getSafeDocuments(raw: unknown): BusinessDocument[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const usedIds = new Set<string>();

  return raw
    .filter(isValidBusinessDocument)
    .map((doc) => ({
      ...doc,
      name: doc.name.trim(),
      meta: doc.meta.trim(),
    }))
    .filter((doc) => {
      const id = String(doc.id)
        .trim()
        .toLowerCase();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);

      return true;
    });
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function BusinessDocumentsCard() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list(
          "business_documents",
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

        setRaw(
          rows.map((row, index) =>
            toBusinessDocument(row, index),
          ),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Business documents are currently unavailable. Please try again later.",
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

  const documents = getSafeDocuments(raw);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const [downloadedId, setDownloadedId] =
    useState<string | null>(null);

  /* --------------------------------
   * Download Handler
   * -------------------------------- */

  const handleDownload = (
    doc: BusinessDocument,
  ): void => {
    const documentId = String(doc.id).trim();

    if (
      !documentId ||
      !isValidBusinessDocument(doc)
    ) {
      return;
    }

    setDownloadingId(documentId);

    /*
     * Add your actual document download
     * logic/API here.
     *
     * This timeout only provides UI feedback
     * until the real download endpoint is connected.
     */
    window.setTimeout(() => {
      setDownloadingId(null);
      setDownloadedId(documentId);

      window.setTimeout(() => {
        setDownloadedId((current) =>
          current === documentId
            ? null
            : current,
        );
      }, 1500);
    }, 500);
  };

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
      "
      aria-labelledby="business-documents-title"
    >
      {/* Heading */}
      <h2
        id="business-documents-title"
        className="
          text-[14px]
          font-bold
          text-ink
          mb-4
        "
      >
        Business Documents
      </h2>

      {/* Documents */}
      {loading ? (
        <div
          className="
            min-h-[80px]
            border
            border-dashed
            border-line
            rounded-lg
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[11.5px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading business documents...
        </div>
      ) : error ? (
        <div
          className="
            min-h-[80px]
            border
            border-dashed
            border-line
            rounded-lg
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[11.5px]
            text-ink-faint
          "
          role="alert"
        >
          {error}
        </div>
      ) : documents.length > 0 ? (
        <div
          className="
            flex
            flex-col
            gap-3.5
          "
        >
          {documents.map((doc) => {
            const documentId =
              String(doc.id).trim();

            const isDownloading =
              downloadingId === documentId;

            const isDownloaded =
              downloadedId === documentId;

            return (
              <div
                key={documentId}
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                {/* File Icon */}
                <span
                  className="
                    w-8
                    h-8
                    rounded-lg
                    bg-blue/10
                    text-blue
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  aria-hidden="true"
                >
                  <FileText size={14} />
                </span>

                {/* Document Details */}
                <div className="min-w-0 flex-1">
                  <div
                    className="
                      text-[12px]
                      font-semibold
                      text-ink
                      truncate
                    "
                    title={doc.name}
                  >
                    {doc.name}
                  </div>

                  <div
                    className="
                      text-[10px]
                      text-ink-faint
                    "
                  >
                    {doc.meta}
                  </div>
                </div>

                {/* Download */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(doc)
                  }
                  disabled={isDownloading}
                  aria-label={
                    isDownloaded
                      ? `${doc.name} downloaded`
                      : `Download ${doc.name}`
                  }
                  className="
                    flex
                    items-center
                    gap-1
                    text-[11.5px]
                    font-semibold
                    text-blue
                    hover:underline
                    shrink-0
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-blue
                    focus-visible:ring-offset-2
                    rounded
                  "
                >
                  {isDownloaded ? (
                    <>
                      <CheckCircle2
                        size={11}
                        className="text-green"
                        aria-hidden="true"
                      />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download
                        size={11}
                        aria-hidden="true"
                      />
                      {isDownloading
                        ? "Downloading..."
                        : "Download"}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            min-h-[80px]
            border
            border-dashed
            border-line
            rounded-lg
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[11.5px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No business documents
          available.
        </div>
      )}
    </section>
  );
}