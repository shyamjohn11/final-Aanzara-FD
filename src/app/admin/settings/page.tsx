"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  Globe,
  MapPin,
  Save,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { settingsApi } from "@/app/api/services";
import GeneralSettingsModal from "@/app/components/Admin/Settings/GeneralSettingsModal";

type SettingsState = {
  siteName: string;
  siteDescription: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  orderNotifications: boolean;
  stockNotifications: boolean;
  customerNotifications: boolean;
  taxEnabled: boolean;
  taxPercentage: string;
  minimumOrder: string;
  freeShippingAbove: string;
};

const DEFAULT_SETTINGS: SettingsState = {
  siteName: "Aanzara",
  siteDescription: "Wholesale marketplace and business shopping platform",
  email: "support@aanzara.com",
  phone: "+91 98765 43210",
  address: "Chennai, Tamil Nadu, India",
  currency: "INR",
  timezone: "Asia/Kolkata",
  language: "English",
  maintenanceMode: false,
  emailNotifications: true,
  orderNotifications: true,
  stockNotifications: true,
  customerNotifications: true,
  taxEnabled: true,
  taxPercentage: "18",
  minimumOrder: "500",
  freeShippingAbove: "2000",
};

export default function SystemSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);

  const [generalModalOpen, setGeneralModalOpen] =
    useState(false);

  const [saved, setSaved] = useState(false);

  /* =======================================================
     LOAD (#143 GET /api/admin/settings) — defaults fallback
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await settingsApi.get();
        const payload = (response as any)?.data ?? response;
        const data = (payload as any)?.data ?? payload;
        if (cancelled || !data || typeof data !== "object") return;
        const merged: SettingsState = {
          ...DEFAULT_SETTINGS,
          ...(Object.fromEntries(
            Object.entries(data).filter(
              ([key]) => key in DEFAULT_SETTINGS,
            ),
          ) as Partial<SettingsState>),
        };
        setSettings(merged);
      } catch {
        // Keep DEFAULT_SETTINGS when the backend is unreachable.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      await settingsApi.save({ ...(settings as unknown as Record<string, unknown>) });
    } catch {
      // Best-effort: fall through to existing local save logic.
    }
    setSaved(true);

    // Connect your API/database here.
    // Example:
    // await fetch("/api/admin/settings", {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(settings),
    // });

    window.setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7FA]">

        {/* PAGE HEADER */}

        <header className="border-b border-[#E4E8EF] bg-white">
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

            <div className="flex min-w-0 items-center gap-4">

              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748A] transition hover:bg-[#EEF3FA] hover:text-[#1769F5]"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1769F5]">
                <Settings size={18} />
              </div>

              <div>
                <h1 className="font-sora text-[21px] font-bold leading-tight text-[#22324D] sm:text-[24px]">
                  System Settings
                </h1>

                <p className="mt-1 text-[10px] text-[#8995A5]">
                  Manage your store and system preferences
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={saveSettings}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#1769F5] px-4 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE]"
            >
              <Save size={15} />
              Save Changes
            </button>

          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">

          {/* BREADCRUMB */}

          <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8995A5]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>

            <span>/</span>

            <span className="font-medium text-[#566579]">
              System Settings
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">

            {/* LEFT COLUMN */}

            <div className="space-y-5">

              {/* GENERAL */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

                <SettingsHeader
                  icon={<Globe size={17} />}
                  title="General Settings"
                  description="Basic information about your Aanzara store"
                  action={
                    <button
                      type="button"
                      onClick={() => setGeneralModalOpen(true)}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-3 text-[9px] font-semibold text-[#52627A] transition hover:border-[#1769F5] hover:text-[#1769F5]"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                  }
                />

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

                  <ReadOnlyField
                    label="Site Name"
                    value={settings.siteName}
                  />

                  <ReadOnlyField
                    label="Support Email"
                    value={settings.email}
                  />

                  <ReadOnlyField
                    label="Phone Number"
                    value={settings.phone}
                  />

                  <ReadOnlyField
                    label="Business Address"
                    value={settings.address}
                  />

                  <div className="sm:col-span-2">
                    <ReadOnlyField
                      label="Site Description"
                      value={settings.siteDescription}
                    />
                  </div>

                </div>
              </section>

              {/* LOCALIZATION */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

                <SettingsHeader
                  icon={<MapPin size={17} />}
                  title="Localization"
                  description="Configure currency, language and timezone"
                />

                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">

                  <SelectField
                    label="Currency"
                    value={settings.currency}
                    options={["INR", "USD", "EUR", "GBP"]}
                    onChange={(value) =>
                      update("currency", value)
                    }
                  />

                  <SelectField
                    label="Timezone"
                    value={settings.timezone}
                    options={[
                      "Asia/Kolkata",
                      "UTC",
                      "Asia/Dubai",
                      "Asia/Singapore",
                    ]}
                    onChange={(value) =>
                      update("timezone", value)
                    }
                  />

                  <SelectField
                    label="Language"
                    value={settings.language}
                    options={[
                      "English",
                      "Tamil",
                      "Hindi",
                    ]}
                    onChange={(value) =>
                      update("language", value)
                    }
                  />

                </div>
              </section>

              {/* ORDERS & TAX */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

                <SettingsHeader
                  icon={<ShoppingCart size={17} />}
                  title="Orders & Tax"
                  description="Configure order and tax preferences"
                />

                <div className="p-5">

                  <ToggleRow
                    icon={<CreditCard size={15} />}
                    title="Enable Tax"
                    description="Apply tax to customer orders"
                    checked={settings.taxEnabled}
                    onChange={(value) =>
                      update("taxEnabled", value)
                    }
                  />

                  {settings.taxEnabled && (
                    <div className="mt-4 max-w-[300px]">
                      <InputField
                        label="Tax Percentage"
                        type="number"
                        value={settings.taxPercentage}
                        onChange={(value) =>
                          update("taxPercentage", value)
                        }
                      />
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <InputField
                      label="Minimum Order Amount"
                      type="number"
                      value={settings.minimumOrder}
                      onChange={(value) =>
                        update("minimumOrder", value)
                      }
                    />

                    <InputField
                      label="Free Shipping Above"
                      type="number"
                      value={settings.freeShippingAbove}
                      onChange={(value) =>
                        update("freeShippingAbove", value)
                      }
                    />

                  </div>
                </div>
              </section>

              {/* NOTIFICATIONS */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

                <SettingsHeader
                  icon={<Bell size={17} />}
                  title="Notifications"
                  description="Choose which admin notifications you want to receive"
                />

                <div className="px-5">

                  <ToggleRow
                    title="Email Notifications"
                    description="Receive important updates by email"
                    checked={settings.emailNotifications}
                    onChange={(value) =>
                      update("emailNotifications", value)
                    }
                  />

                  <ToggleRow
                    title="Order Notifications"
                    description="Get notified when a new order is placed"
                    checked={settings.orderNotifications}
                    onChange={(value) =>
                      update("orderNotifications", value)
                    }
                  />

                  <ToggleRow
                    title="Stock Notifications"
                    description="Get alerts when products are running low"
                    checked={settings.stockNotifications}
                    onChange={(value) =>
                      update("stockNotifications", value)
                    }
                  />

                  <ToggleRow
                    title="Customer Notifications"
                    description="Get notified about new customer registrations"
                    checked={settings.customerNotifications}
                    onChange={(value) =>
                      update("customerNotifications", value)
                    }
                  />

                </div>
              </section>

            </div>

            {/* RIGHT COLUMN */}

            <div className="space-y-5">

              {/* STORE STATUS */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

                <SettingsHeader
                  icon={<Store size={17} />}
                  title="Store Status"
                  description="Control your storefront availability"
                />

                <ToggleRow
                  title="Maintenance Mode"
                  description="Temporarily disable customer access"
                  checked={settings.maintenanceMode}
                  onChange={(value) =>
                    update("maintenanceMode", value)
                  }
                />

                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    settings.maintenanceMode
                      ? "border-[#F1D0D0] bg-[#FFF6F6]"
                      : "border-[#D6EBDD] bg-[#F2FBF5]"
                  }`}
                >
                  <div className="flex items-center gap-2">

                    <span
                      className={`h-2 w-2 rounded-full ${
                        settings.maintenanceMode
                          ? "bg-[#E05252]"
                          : "bg-[#25A55B]"
                      }`}
                    />

                    <span className="text-[9px] font-semibold text-[#33415A]">
                      {settings.maintenanceMode
                        ? "Store is in maintenance mode"
                        : "Store is currently live"}
                    </span>

                  </div>

                  <p className="mt-1 text-[8px] leading-4 text-[#8995A5]">
                    {settings.maintenanceMode
                      ? "Customers will not be able to access the storefront."
                      : "Customers can browse and place orders normally."}
                  </p>
                </div>

              </section>

              {/* SYSTEM INFORMATION */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

                <SettingsHeader
                  icon={<ShieldCheck size={17} />}
                  title="System Information"
                  description="Current application configuration"
                />

                <div className="mt-2 space-y-3">

                  <InfoRow
                    label="Application"
                    value="Aanzara Admin"
                  />

                  <InfoRow
                    label="Environment"
                    value="Production"
                  />

                  <InfoRow
                    label="Currency"
                    value={settings.currency}
                  />

                  <InfoRow
                    label="Timezone"
                    value={settings.timezone}
                  />

                  <InfoRow
                    label="Language"
                    value={settings.language}
                  />

                </div>
              </section>

              {/* SHIPPING */}

              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

                <SettingsHeader
                  icon={<Truck size={17} />}
                  title="Shipping"
                  description="Current shipping configuration"
                />

                <div className="mt-3 rounded-xl bg-[#F7F9FC] p-4">

                  <InfoRow
                    label="Free shipping above"
                    value={`₹${Number(
                      settings.freeShippingAbove || 0
                    ).toLocaleString("en-IN")}`}
                  />

                  <div className="mt-3">
                    <InfoRow
                      label="Minimum order"
                      value={`₹${Number(
                        settings.minimumOrder || 0
                      ).toLocaleString("en-IN")}`}
                    />
                  </div>

                </div>
              </section>

            </div>
          </div>
        </main>

        {/* SUCCESS */}

        {saved && (
          <div className="fixed bottom-5 right-5 z-[200] flex items-center gap-2 rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">
            <CheckCircle2
              size={17}
              className="text-[#69D393]"
            />

            <div>
              <p className="text-[10px] font-bold">
                Settings Saved
              </p>
              <p className="mt-0.5 text-[8px] text-[#C8D4E7]">
                System settings updated successfully.
              </p>
            </div>
          </div>
        )}

        {/* GENERAL SETTINGS MODAL */}

        <GeneralSettingsModal
          open={generalModalOpen}
          settings={settings}
          onClose={() => setGeneralModalOpen(false)}
          onSave={(values) => {
            setSettings((current) => ({
              ...current,
              ...values,
            }));
            setGeneralModalOpen(false);
            setSaved(true);

            window.setTimeout(() => {
              setSaved(false);
            }, 2200);
          }}
        />

      </div>
    </AdminLayout>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function SettingsHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#EDF0F4] px-5 py-4">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
          {icon}
        </div>

        <div>
          <h2 className="text-[12px] font-bold text-[#293953]">
            {title}
          </h2>

          <p className="mt-1 text-[8px] text-[#8995A5]">
            {description}
          </p>
        </div>

      </div>

      {action}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </p>

      <p className="mt-2 text-[10px] leading-5 text-[#52627A]">
        {value}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] text-[#33415A] outline-none transition focus:border-[#1769F5]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] text-[#33415A] outline-none focus:border-[#1769F5]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F0F2F5] py-4 last:border-b-0">

      <div className="flex min-w-0 items-center gap-3">

        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F6FA] text-[#66748B]">
            {icon}
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-[#33415A]">
            {title}
          </p>

          <p className="mt-1 text-[8px] leading-4 text-[#8995A5]">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#1769F5]" : "bg-[#D7DDE6]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F0F2F5] pb-3 last:border-0 last:pb-0">

      <span className="text-[8px] text-[#8995A5]">
        {label}
      </span>

      <span className="max-w-[200px] truncate text-right text-[9px] font-semibold text-[#52627A]">
        {value}
      </span>

    </div>
  );
}
