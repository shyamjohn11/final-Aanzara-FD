"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  PenLine,
  ArrowRight,
  Boxes,
} from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";
import BulkQuoteDialog from "@/app/components/BulkQuoteDialog";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function BulkOrderCTA() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");
  const [quoteOpen, setQuoteOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const loadChecklist = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await contentApi.list(
          "ws_bulk_checklist",
        );
        const data = response.data as unknown;
        const rows: ContentItem[] = Array.isArray(data)
          ? (data as ContentItem[])
          : Array.isArray((data as any)?.items)
            ? ((data as any).items as ContentItem[])
            : [];
        const mapped = rows
          .map((row) =>
            typeof row.title === "string"
              ? row.title.trim()
              : "",
          )
          .filter((title) => title.length > 0);
        if (!cancelled) {
          setChecklist(mapped);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load bulk order details.");
          setChecklist([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChecklist();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setFileError(null);
    setFileName(null);

    if (!file) {
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be 10 MB or less.");
      event.target.value = "";
      return;
    }

    // File type validation
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError(
        "Please upload an Excel, CSV, JPG, PNG, or WebP file."
      );
      event.target.value = "";
      return;
    }

    setFileName(file.name);
  };

  return (
    <section
      className="bg-green/10 border border-green/20 rounded-card p-6 sm:p-8"
      aria-labelledby="bulk-order-title"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-center">
        {/* =========================
            BULK ORDER INFORMATION
        ========================= */}

        <div className="flex items-center gap-6">
          {/* ICON */}

          <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-white items-center justify-center shrink-0 shadow-sm">
            <Boxes
              size={34}
              className="text-green-deep"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2
              id="bulk-order-title"
              className="font-sora font-bold text-[19px] text-navy"
            >
              Need a Bulk Order?
            </h2>

            <p className="text-[12.5px] text-ink-soft mt-1.5 mb-4">
              Get the best prices for your business needs.
            </p>

            {/* CHECKLIST */}

            <div className="flex flex-col gap-2 mb-5">
              {loading ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-[12px] text-ink-soft"
                >
                  Loading checklist…
                </p>
              ) : loadError && checklist.length === 0 ? (
                <p
                  role="alert"
                  className="text-[12px] text-ink-soft"
                >
                  {loadError}
                </p>
              ) : checklist.length === 0 ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-[12px] text-ink-soft"
                >
                  Checklist is currently unavailable.
                </p>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-green-deep shrink-0"
                      aria-hidden="true"
                    />

                    <span className="text-[12px] text-ink">
                      {item}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* REQUEST QUOTE — opens the quote request dialog.
                Submissions land in /admin/pricing-requests. */}

            <button
              type="button"
              onClick={() => setQuoteOpen(true)}
              className="
                flex
                items-center
                gap-2
                bg-green
                hover:bg-green-deep
                transition-colors
                text-white
                text-[12.5px]
                font-bold
                px-5
                py-3
                rounded-lg
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green
                focus-visible:ring-offset-2
              "
            >
              Request Bulk Quote

              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* =========================
            REQUIREMENT UPLOAD
        ========================= */}

        <div className="bg-white border-2 border-dashed border-green/40 rounded-card p-6 flex flex-col items-center text-center">
          <FileUp
            size={26}
            className="text-green-deep mb-3"
            aria-hidden="true"
          />

          <p className="text-[12.5px] font-semibold text-ink mb-1">
            Upload Requirement List
          </p>

          <p className="text-[11px] text-ink-soft mb-4">
            Upload Excel/CSV or image file
          </p>

          {/* FILE UPLOAD */}

          <label
            htmlFor="bulk-requirement-file"
            className="
              cursor-pointer
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              text-[12px]
              font-bold
              px-5
              py-2.5
              rounded-lg
              focus-within:ring-2
              focus-within:ring-green
              focus-within:ring-offset-2
            "
          >
            Choose File

            <input
              id="bulk-requirement-file"
              type="file"
              accept=".xlsx,.xls,.csv,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {/* SELECTED FILE */}

          {fileName && (
            <p
              className="text-[11px] text-green-deep font-semibold mt-2 truncate max-w-full"
              title={fileName}
            >
              {fileName}
            </p>
          )}

          {/* FILE ERROR */}

          {fileError && (
            <p
              className="text-[11px] text-red-600 font-semibold mt-2"
              role="alert"
            >
              {fileError}
            </p>
          )}

          {/* DIVIDER */}

          <div className="flex items-center gap-2 w-full my-4">
            <div className="h-px flex-1 bg-line" />

            <span className="text-[11px] text-ink-faint">
              or
            </span>

            <div className="h-px flex-1 bg-line" />
          </div>

          {/* MANUAL ENTRY */}

          <button
            type="button"
            className="
              flex
              items-center
              gap-1.5
              border
              border-line
              text-ink
              text-[12px]
              font-bold
              px-4
              py-2.5
              rounded-lg
              hover:border-navy
              hover:text-navy
              transition-colors
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-navy
              focus-visible:ring-offset-2
            "
          >
            <PenLine
              size={13}
              aria-hidden="true"
            />

            Enter Items Manually
          </button>
        </div>
      </div>

      <BulkQuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
      />
    </section>
  );
}
