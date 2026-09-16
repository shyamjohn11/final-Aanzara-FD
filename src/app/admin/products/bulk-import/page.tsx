"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";
import { Button } from "@nextui-org/react";
import {
  ArrowLeft,
  Download,
  FileText,
  Package,
  X,
} from "lucide-react";

type ImportError = {
  rowNumber: number;
  sku: string;
  field: string;
  message: string;
};

type ImportResult = {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportError[];
};

export default function BulkImportPage() {
  const router = useRouter();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear selected file
  const clearSelectedFile = () => {
    setFile(null);
    setSelectedFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Excel file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const isXlsx =
      selectedFile.name.toLowerCase().endsWith(".xlsx") ||
      selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isXlsx) {
      toast.error("Only .xlsx files are allowed.");

      e.target.value = "";
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxFileSize) {
      toast.error("File size must be 10 MB or less.");

      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setSelectedFileName(selectedFile.name);

    toast.success("Excel file selected successfully.");
  };

  // Download Excel template
  const downloadTemplate = async () => {
    try {
      const response = await api.get(
        "/products/bulk-import/template",
        {
          responseType: "blob",
        }
      );

      const blob = response.data as Blob;

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "ProductImportTemplate.xlsx";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully.");
    } catch (err) {
      console.error("Template download error:", err);

      toast.error(
        extractErrorMessage(
          err,
          "Failed to download template."
        )
      );
    }
  };

  // Import products
  const handleImport = async () => {
    if (!file) {
      toast.error(
        "Please select an Excel file before importing."
      );

      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post(
        "/products/bulk-import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const result: ImportResult = {
        success: response.data?.success ?? true,
        totalRows: response.data?.totalRows ?? 0,
        successfulRows:
          response.data?.successfulRows ?? 0,
        failedRows:
          response.data?.failedRows ?? 0,
        errors: response.data?.errors ?? [],
      };

      setImportResult(result);

      setShowImportDialog(false);

      if (result.successfulRows > 0) {
        toast.success(
          `${result.successfulRows} product(s) imported successfully.`
        );
      }

      if (result.failedRows > 0) {
        toast.error(
          `${result.failedRows} product(s) failed to import.`
        );
      }

      if (
        result.successfulRows === 0 &&
        result.failedRows === 0
      ) {
        toast.error(
          "The Excel file did not contain any importable products."
        );
      }
    } catch (err) {
      console.error("Bulk import error:", err);

      toast.error(
        extractErrorMessage(
          err,
          "Failed to import products."
        )
      );
    } finally {
      setIsImporting(false);
      clearSelectedFile();
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-border bg-white px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          aria-label="Back to products"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--hover)] hover:text-[color:var(--primary)]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[color:var(--primary)] sm:text-[20px]">
            Bulk Product Import
          </h1>

          <p className="hidden text-[9px] text-[color:var(--muted)] sm:block">
            Upload an Excel file to import multiple products at once
          </p>
        </div>

        <Button
          variant="solid"
          size="sm"
          onClick={() => setShowImportDialog(true)}
          className="ml-auto h-9 w-9 min-w-9 items-center justify-center rounded-lg bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary-dark)]"
          isIconOnly
          aria-label="Open bulk import"
        >
          <Package size={18} />
        </Button>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {/* BREADCRUMB */}
        <div className="mb-5 flex items-center gap-2 text-[9px] text-[color:var(--muted)]">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="hover:text-[color:var(--primary)]"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-[color:var(--primary)]">
            Products
          </span>

          <span>/</span>

          <span>Bulk Import</span>
        </div>

        {/* IMPORT SECTION */}
        <section className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-sora text-[16px] font-bold text-[color:var(--primary)]">
            Bulk Product Import
          </h2>

          {/* DOWNLOAD TEMPLATE */}
          <div className="mb-6 rounded-lg border border-border bg-[color:var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <Package
                size={20}
                className="text-[color:var(--primary)]"
              />

              <div>
                <h3 className="font-sora text-[14px] font-medium text-[color:var(--primary)]">
                  Download Excel Template
                </h3>

                <p className="text-[10px] text-[color:var(--muted)]">
                  Download the template format, fill in your product
                  data, and upload it here.
                </p>
              </div>
            </div>

            <Button
              variant="bordered"
              size="sm"
              onClick={downloadTemplate}
              className="mt-3 flex items-center gap-2"
            >
              <Download size={14} />
              Download Template
            </Button>
          </div>

          {/* UPLOAD SECTION */}
          <div className="mt-6 rounded-lg border border-border bg-[color:var(--surface)] p-4">
            <h3 className="mb-3 font-sora text-[14px] font-medium text-[color:var(--primary)]">
              Upload Excel File
            </h3>

            {selectedFileName && (
              <div className="mb-3 rounded-lg border border-border bg-white p-3">
                <div className="flex items-center gap-3">
                  <FileText
                    size={16}
                    className="text-[color:var(--primary)]"
                  />

                  <div className="flex-1">
                    <span className="font-medium text-[11px]">
                      {selectedFileName}
                    </span>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="ml-2 text-[10px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              variant="bordered"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Select Excel File
            </Button>

            <p className="mt-2 text-[10px] text-[color:var(--muted)]">
              Maximum file size: 10 MB. Only .xlsx files are supported.
            </p>
          </div>

          {/* IMPORT RESULT */}
          {importResult && (
            <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-sora text-[16px] font-bold text-[color:var(--primary)]">
                Import Result
              </h2>

              {/* SUMMARY */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-[color:var(--muted)]">
                    Total Rows
                  </p>

                  <p className="text-lg font-bold">
                    {importResult.totalRows}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-[color:var(--muted)]">
                    Successful
                  </p>

                  <p className="text-lg font-bold">
                    {importResult.successfulRows}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-[color:var(--muted)]">
                    Failed
                  </p>

                  <p className="text-lg font-bold">
                    {importResult.failedRows}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-[color:var(--muted)]">
                    Status
                  </p>

                  <p className="text-lg font-bold">
                    {importResult.success ? "Success" : "Failed"}
                  </p>
                </div>
              </div>

              {/* ERRORS */}
              {importResult.failedRows > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left">
                    <thead className="bg-[color:var(--surface)]">
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-semibold">
                          Row
                        </th>

                        <th className="px-4 py-3 text-[11px] font-semibold">
                          SKU
                        </th>

                        <th className="px-4 py-3 text-[11px] font-semibold">
                          Field
                        </th>

                        <th className="px-4 py-3 text-[11px] font-semibold">
                          Message
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {importResult.errors.map(
                        (error, index) => (
                          <tr
                            key={`${error.rowNumber}-${error.sku}-${error.field}-${index}`}
                            className="border-t border-border"
                          >
                            <td className="px-4 py-3 text-[11px]">
                              {error.rowNumber}
                            </td>

                            <td className="px-4 py-3 text-[11px]">
                              {error.sku || "-"}
                            </td>

                            <td className="px-4 py-3 text-[11px]">
                              {error.field || "-"}
                            </td>

                            <td className="px-4 py-3 text-[11px]">
                              {error.message}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-[color:var(--muted)]">
                  No errors. All rows imported successfully.
                </p>
              )}

              {/* RESULT ACTIONS */}
              <div className="mt-6 flex gap-3">
                <Button
                  variant="bordered"
                  size="sm"
                  onClick={() => setImportResult(null)}
                  className="flex-1"
                >
                  Close
                </Button>

                {importResult.successfulRows > 0 && (
                  <Button
                    variant="solid"
                    size="sm"
                    onClick={() => {
                      setImportResult(null);
                      router.push("/admin/products");
                    }}
                    className="flex-1 bg-[color:var(--primary)] text-white"
                  >
                    OK
                  </Button>
                )}
              </div>
            </section>
          )}
        </section>
      </div>

      {/* IMPORT DIALOG */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            {/* DIALOG HEADER */}
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-sora text-[16px] font-bold text-[color:var(--primary)]">
                Bulk Product Import
              </h2>

              <button
                type="button"
                onClick={() => {
                  if (!isImporting) {
                    setShowImportDialog(false);
                  }
                }}
                disabled={isImporting}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* DIALOG BODY */}
            <div className="space-y-5 p-6">
              {/* FILE SELECTION */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold text-[color:var(--muted)]">
                  Select Excel File
                </label>

                <div className="flex items-center gap-2 rounded-lg border border-border bg-[color:var(--surface)] p-3">
                  <FileText
                    size={16}
                    className="text-[color:var(--primary)]"
                  />

                  <span className="flex-1 truncate text-[11px]">
                    {selectedFileName || "No file selected"}
                  </span>

                  {selectedFileName && (
                    <Button
                      variant="light"
                      size="sm"
                      onClick={clearSelectedFile}
                      isIconOnly
                      aria-label="Remove selected file"
                    >
                      <X size={14} />
                    </Button>
                  )}

                  <Button
                    variant="bordered"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    Select
                  </Button>
                </div>
              </div>

              {/* INSTRUCTIONS */}
              <div>
                <p className="mb-3 text-[10px] text-[color:var(--muted)]">
                  The Excel file should contain the following columns:
                </p>

                <div className="grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-2">
                  <div>
                    <span className="font-medium">SKU</span> - Unique
                    product identifier
                  </div>

                  <div>
                    <span className="font-medium">
                      Product Name
                    </span>{" "}
                    - Product name
                  </div>

                  <div>
                    <span className="font-medium">
                      Category
                    </span>{" "}
                    - Category name
                  </div>

                  <div>
                    <span className="font-medium">
                      Sub-Category
                    </span>{" "}
                    - Sub-category name
                  </div>

                  <div>
                    <span className="font-medium">Brand</span> -
                    Brand name
                  </div>

                  <div>
                    <span className="font-medium">
                      Description
                    </span>{" "}
                    - Product description
                  </div>

                  <div>
                    <span className="font-medium">Price</span> -
                    Product price
                  </div>

                  <div>
                    <span className="font-medium">GST %</span> -
                    GST percentage
                  </div>

                  <div>
                    <span className="font-medium">Stock</span> -
                    Initial stock quantity
                  </div>

                  <div>
                    <span className="font-medium">Status</span> -
                    active/inactive
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="bordered"
                  size="sm"
                  disabled={isImporting}
                  onClick={() => {
                    setShowImportDialog(false);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="solid"
                  size="sm"
                  disabled={!file || isImporting}
                  onClick={handleImport}
                  className="bg-[color:var(--primary)] text-white"
                >
                  {isImporting
                    ? "Importing..."
                    : "Import Products"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}