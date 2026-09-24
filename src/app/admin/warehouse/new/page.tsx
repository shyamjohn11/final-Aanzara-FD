// File: src/app/admin/warehouse/new/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  Warehouse as WarehouseIcon,
  MapPin,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import AdminSidebar from "@/app/components/Admin/AdminSidebar";
import AdminHeader from "@/app/components/Admin/AdminHeader";

// Same service layer used on the Warehouse list page.
import { extractErrorMessage } from "@/app/api/api";
import { warehousesApi } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type WarehouseStatus = 0 | 1; // 0 = Active, 1 = Inactive

interface WarehouseFormState {
  warehouseName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  status: WarehouseStatus;
}

interface FormErrors {
  warehouseName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/* ============================================================
   PAGE
============================================================ */

export default function AddWarehousePage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState<WarehouseFormState>({
    warehouseName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    status: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const navigate = (path: string) => {
    setSidebarOpen(false);
    router.push(path);
  };

  const updateField = <K extends keyof WarehouseFormState>(
    key: K,
    value: WarehouseFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.warehouseName.trim()) {
      nextErrors.warehouseName = "Warehouse name is required.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      // #52 POST /api/admin/warehouses (proxied via /api rewrite)
      await warehousesApi.create({
        warehouseName: form.warehouseName.trim(),
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
        status: form.status,
      } as any);
      navigate("/admin/warehouse");
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, "Failed to create warehouse. Please try again.")
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* ======================================================
          ADMIN SIDEBAR
      ======================================================= */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ======================================================
          MAIN AREA
      ======================================================= */}

      <div className="lg:pl-[270px]">

        {/* ====================================================
            ADMIN HEADER
        ===================================================== */}

        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* ====================================================
            CONTENT
        ===================================================== */}

        <main className="mx-auto w-full max-w-[900px] p-4 sm:p-6 lg:p-8">

          {/* ==================================================
              PAGE HEADER
          =================================================== */}

          <div className="mb-6 flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/admin/warehouse")}
              aria-label="Back to warehouses"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3E8EF] bg-white text-[#10265B] shadow-sm transition hover:bg-[#F5F8FF]"
            >
              <ArrowLeft size={19} />
            </button>

            <div>

              <h1 className="font-sora text-[25px] font-bold tracking-tight text-[#1D2D49] sm:text-[29px]">
                Add Warehouse
              </h1>

              <p className="mt-1 text-xs text-[#7B8798]">
                Create a new warehouse location
              </p>

            </div>

          </div>

          {/* ==================================================
              BREADCRUMB
          =================================================== */}

          <div className="mb-6 flex items-center gap-2 text-[11px] text-[#8C98A9]">

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>

            <ChevronRight size={12} />

            <button
              type="button"
              onClick={() => navigate("/admin/warehouse")}
              className="hover:text-[#1769F5]"
            >
              Warehouse
            </button>

            <ChevronRight size={12} />

            <span className="text-[#53627A]">
              Add Warehouse
            </span>

          </div>

          {/* ==================================================
              SUBMIT ERROR BANNER
          =================================================== */}

          {submitError && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F5C2C2] bg-[#FDECEC] p-4">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FBD9D9] text-[#E14B4B]">
                <AlertTriangle size={17} />
              </div>

              <div>

                <p className="text-[11px] font-bold text-[#8A2323]">
                  Couldn&apos;t create warehouse
                </p>

                <p className="mt-0.5 text-[10px] text-[#A34747]">
                  {submitError}
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              FORM CARD
          =================================================== */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-7"
          >

            <div className="flex items-center gap-3 border-b border-[#EDF0F4] pb-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0FF] text-[#3260B4]">
                <WarehouseIcon size={18} />
              </div>

              <div>

                <h2 className="text-sm font-bold text-[#253650]">
                  Warehouse Details
                </h2>

                <p className="mt-0.5 text-[10px] text-[#8793A4]">
                  Fill in the details below to add a new warehouse
                </p>

              </div>

            </div>

            <div className="mt-6 grid gap-5">

              {/* Warehouse Name */}
              <div>

                <label
                  htmlFor="warehouseName"
                  className="mb-1.5 block text-[11px] font-semibold text-[#33415A]"
                >
                  Warehouse Name
                </label>

                <input
                  id="warehouseName"
                  type="text"
                  value={form.warehouseName}
                  onChange={(event) =>
                    updateField("warehouseName", event.target.value)
                  }
                  placeholder="e.g. Aanzara Central Warehouse"
                  className={`h-11 w-full rounded-xl border px-3.5 text-[11px] text-[#33415A] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5] ${
                    errors.warehouseName
                      ? "border-[#E14B4B]"
                      : "border-[#E0E5EC]"
                  }`}
                />

                {errors.warehouseName && (
                  <p className="mt-1.5 text-[10px] text-[#E14B4B]">
                    {errors.warehouseName}
                  </p>
                )}

              </div>

              {/* Address */}
              <div>

                <label
                  htmlFor="address"
                  className="mb-1.5 block text-[11px] font-semibold text-[#33415A]"
                >
                  Address
                </label>

                <div
                  className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 ${
                    errors.address
                      ? "border-[#E14B4B]"
                      : "border-[#E0E5EC] focus-within:border-[#1769F5]"
                  }`}
                >

                  <MapPin
                    size={14}
                    className="mt-0.5 shrink-0 text-[#98A3B2]"
                  />

                  <textarea
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="e.g. 12 Anna Salai, Chennai, Tamil Nadu"
                    rows={2}
                    className="w-full resize-none bg-transparent text-[11px] text-[#33415A] outline-none placeholder:text-[#98A3B2]"
                  />

                </div>

                {errors.address && (
                  <p className="mt-1.5 text-[10px] text-[#E14B4B]">
                    {errors.address}
                  </p>
                )}

              </div>

              {/* City / State / Pincode */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="city" className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">City</label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="e.g. Chennai"
                    className="h-11 w-full rounded-xl border border-[#E0E5EC] px-3.5 text-[11px] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5]"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">State</label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    placeholder="e.g. Tamil Nadu"
                    className="h-11 w-full rounded-xl border border-[#E0E5EC] px-3.5 text-[11px] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5]"
                  />
                </div>
                <div>
                  <label htmlFor="pincode" className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">Pincode</label>
                  <input
                    id="pincode"
                    type="text"
                    value={form.pincode}
                    onChange={(event) => updateField("pincode", event.target.value)}
                    placeholder="e.g. 600002"
                    className="h-11 w-full rounded-xl border border-[#E0E5EC] px-3.5 text-[11px] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="latitude" className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">Latitude (optional)</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(event) => updateField("latitude", event.target.value)}
                    placeholder="e.g. 13.0827"
                    className="h-11 w-full rounded-xl border border-[#E0E5EC] px-3.5 text-[11px] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5]"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">Longitude (optional)</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(event) => updateField("longitude", event.target.value)}
                    placeholder="e.g. 80.2707"
                    className="h-11 w-full rounded-xl border border-[#E0E5EC] px-3.5 text-[11px] outline-none placeholder:text-[#98A3B2] focus:border-[#1769F5]"
                  />
                </div>
              </div>

              {/* Status */}
              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-[#33415A]">
                  Status
                </label>

                <div className="flex flex-wrap items-center gap-2">

                  <StatusOption
                    label="Active"
                    icon={CheckCircle2}
                    active={form.status === 0}
                    activeStyle="border-[#249357] bg-[#EAF8F0] text-[#249357]"
                    onClick={() => updateField("status", 0)}
                  />

                  <StatusOption
                    label="Inactive"
                    icon={XCircle}
                    active={form.status === 1}
                    activeStyle="border-[#E14B4B] bg-[#FDECEC] text-[#E14B4B]"
                    onClick={() => updateField("status", 1)}
                  />

                </div>

              </div>

            </div>

            {/* ================================================
                ACTIONS
            ================================================= */}

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-[#EDF0F4] pt-5">

              <button
                type="button"
                onClick={() => navigate("/admin/warehouse")}
                disabled={submitting}
                className="rounded-xl border border-[#E3E8EF] bg-white px-4 py-2.5 text-xs font-semibold text-[#53627A] shadow-sm transition hover:bg-[#F5F8FF] disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1769F5] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0F5DDF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {submitting ? "Saving..." : "Save Warehouse"}
              </button>

            </div>

          </form>

        </main>

      </div>

    </div>
  );
}

/* ============================================================
   STATUS OPTION
============================================================ */

function StatusOption({
  label,
  icon: Icon,
  active,
  activeStyle,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  activeStyle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[10px] font-semibold transition ${
        active
          ? activeStyle
          : "border-[#E0E5EC] bg-white text-[#5B6B84] hover:bg-[#F5F8FF]"
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
