"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";
import { Button } from "@nextui-org/react";
import { ArrowLeft, Download, FileText, Package, X } from "lucide-react";

import AdminSidebar from "@/app/components/Admin/AdminSidebar";
import AdminHeader from "@/app/components/Admin/AdminHeader";

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

const REQUIRED_COLUMNS = [
  "SKU",
  "Product Name",
  "Category",
  "Sub-Category",
  "Brand",
  "Description",
  "Price",
  "GST %",
  "Stock",
  "Status",
];

export default function BulkImportPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await api.get("/products/bulk-import/template", {
        responseType: "blob",
      });

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

      toast.error(extractErrorMessage(err, "Failed to download template."));
    }
  };

  // Import products
  const handleImport = async () => {
    if (!file) {
      toast.error("Please select an Excel file before importing.");

      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post("/products/bulk-import", formData);

      const result: ImportResult = {
        success: response.data?.success ?? true,
        totalRows: response.data?.totalRows ?? 0,
        successfulRows: response.data?.successfulRows ?? 0,
        failedRows: response.data?.failedRows ?? 0,
        errors: response.data?.errors ?? [],
      };

      setImportResult(result);

      if (result.successfulRows > 0) {
        toast.success(
          `${result.successfulRows} product(s) imported successfully.`,
        );
      }

      if (result.failedRows > 0) {
        toast.error(`${result.failedRows} product(s) failed to import.`);
      }

      if (result.successfulRows === 0 && result.failedRows === 0) {
        toast.error("The Excel file did not contain any importable products.");
      }
    } catch (err) {
      console.error("Bulk import error:", err);

      toast.error(extractErrorMessage(err, "Failed to import products."));
    } finally {
      setIsImporting(false);
      clearSelectedFile();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">
      {/* ADMIN SIDEBAR */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[270px]">
        {/* ADMIN HEADER */}
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {/* PAGE HEADER — matches Products page pattern */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              aria-label="Back to products"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7B8798] transition hover:bg-[#F5F8FF] hover:text-[#173B7A]"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="font-sora text-[20px] font-bold text-[#1D2D49] sm:text-[22px]">
                Bulk Product Import
              </h1>

              <p className="text-[11px] text-[#7B8798]">
                Upload an Excel file to import multiple products at once
              </p>
            </div>
          </div>

          {/* BREADCRUMB */}
          <div className="mb-6 flex items-center gap-2 text-[11px] text-[#7B8798]">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="hover:text-[#173B7A]"
            >
              Dashboard
            </button>

            <span>/</span>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="hover:text-[#173B7A]"
            >
              Products
            </button>

            <span>/</span>

            <span className="font-medium text-[#253650]">Bulk Import</span>
          </div>

          {/* IMPORT SECTION */}
          <section className="rounded-2xl border border-[#E4E8EF] bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-sora text-[16px] font-bold text-[#1D2D49]">
              Bulk Product Import
            </h2>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* DOWNLOAD TEMPLATE CARD */}
              <div className="rounded-xl border border-[#E4E8EF] bg-[#FAFBFD] p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#3260B4]">
                    <Package size={18} />
                  </span>

                  <div>
                    <h3 className="font-sora text-[13px] font-semibold text-[#253650]">
                      Download Excel Template
                    </h3>

                    <p className="text-[11px] text-[#7B8798]">
                      Download the template format, fill in your product data,
                      and upload it here.
                    </p>
                  </div>
                </div>

                <Button
                  variant="bordered"
                  size="sm"
                  onPress={downloadTemplate}
                  className="flex items-center gap-2 border-[#DFE5ED] text-[#33415A]"
                >
                  <Download size={14} />
                  Download Template
                </Button>

                <div className="mt-4 rounded-lg border border-dashed border-[#DFE5ED] bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#7B8798]">
                    Required columns
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {REQUIRED_COLUMNS.map((col) => (
                      <span
                        key={col}
                        className="rounded-full border border-[#E4E8EF] bg-[#FAFBFD] px-2 py-0.5 text-[10px] text-[#7B8798]"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* UPLOAD CARD */}
              <div className="rounded-xl border border-[#E4E8EF] bg-[#FAFBFD] p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#3260B4]">
                    <FileText size={18} />
                  </span>

                  <div>
                    <h3 className="font-sora text-[13px] font-semibold text-[#253650]">
                      Upload Excel File
                    </h3>

                    <p className="text-[11px] text-[#7B8798]">
                      Maximum file size: 10 MB. Only .xlsx files are supported.
                    </p>
                  </div>
                </div>

                {selectedFileName && (
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#E4E8EF] bg-white p-3">
                    <FileText size={16} className="shrink-0 text-[#3260B4]" />

                    <span className="flex-1 truncate text-[11px] font-medium text-[#33415A]">
                      {selectedFileName}
                    </span>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      aria-label="Remove selected file"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#7B8798] transition hover:bg-[#FFF0F0] hover:text-[#E14B4B]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border-[#DFE5ED] text-[#33415A]"
                  >
                    <FileText size={14} />
                    Select Excel File
                  </Button>

                  <Button
                    variant="solid"
                    size="sm"
                    isDisabled={!file || isImporting}
                    onPress={handleImport}
                    className="flex items-center gap-2 bg-[#173B7A] text-white hover:bg-[#214B96] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Package size={14} />
                    {isImporting ? "Importing..." : "Import Products"}
                  </Button>
                </div>
              </div>
            </div>

            {/* IMPORT RESULT */}
            {importResult && (
              <section className="mt-6 rounded-xl border border-[#E4E8EF] bg-[#FAFBFD] p-6">
                <h2 className="mb-4 font-sora text-[16px] font-bold text-[#1D2D49]">
                  Import Result
                </h2>

                {/* SUMMARY */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#E4E8EF] bg-white p-3">
                    <p className="text-[10px] text-[#7B8798]">Total Rows</p>

                    <p className="text-lg font-bold text-[#1D2D49]">
                      {importResult.totalRows}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E4E8EF] bg-white p-3">
                    <p className="text-[10px] text-[#7B8798]">Successful</p>

                    <p className="text-lg font-bold text-[#1D2D49]">
                      {importResult.successfulRows}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E4E8EF] bg-white p-3">
                    <p className="text-[10px] text-[#7B8798]">Failed</p>

                    <p className="text-lg font-bold text-[#1D2D49]">
                      {importResult.failedRows}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E4E8EF] bg-white p-3">
                    <p className="text-[10px] text-[#7B8798]">Status</p>

                    <p className="text-lg font-bold text-[#1D2D49]">
                      {importResult.success ? "Success" : "Failed"}
                    </p>
                  </div>
                </div>

                {/* ERRORS */}
                {importResult.failedRows > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-[#E4E8EF] bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-[#FAFBFD]">
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
                        {importResult.errors.map((error, index) => (
                          <tr
                            key={`${error.rowNumber}-${error.sku}-${error.field}-${index}`}
                            className="border-t border-[#E4E8EF]"
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#7B8798]">
                    No errors. All rows imported successfully.
                  </p>
                )}

                {/* RESULT ACTIONS */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => setImportResult(null)}
                    className="flex-1 border-[#DFE5ED] text-[#33415A]"
                  >
                    Close
                  </Button>

                  {importResult.successfulRows > 0 && (
                    <Button
                      variant="solid"
                      size="sm"
                      onPress={() => {
                        setImportResult(null);
                        router.push("/admin/products");
                      }}
                      className="flex-1 bg-[#173B7A] text-white hover:bg-[#214B96]"
                    >
                      OK
                    </Button>
                  )}
                </div>
              </section>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
