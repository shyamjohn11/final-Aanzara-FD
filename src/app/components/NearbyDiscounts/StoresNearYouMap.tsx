"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Navigation,
} from "lucide-react";

import { storesApi } from "@/app/api/services";
import { STORE_DISCOUNTS } from "@/app/data/nearbyDiscounts";

interface PinPosition {
  top: string;
  left: string;
}

interface NearStore {
  id: string;
  image: string;
  name: string;
  distance: string;
}

/* --------------------------------
 * Map pin positions
 * -------------------------------- */
const PIN_POSITIONS: PinPosition[] = [
  { top: "28%", left: "42%" },
  { top: "48%", left: "62%" },
  { top: "62%", left: "30%" },
  { top: "38%", left: "20%" },
];

/* --------------------------------
 * Backend payload helpers
 * (#100 GET /api/admin/stores — paginated or plain array)
 * -------------------------------- */
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractStoreRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "stores", "data"]) {
      const nested = payload[key];

      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return [];
}

function getTextField(
  raw: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

/* --------------------------------
 * Map a backend store row to a
 * renderable nearby-store entry
 * -------------------------------- */
function mapStoreRow(raw: Record<string, unknown>): NearStore | null {
  const id = getTextField(raw, ["storeId", "id"]);

  const name = getTextField(raw, [
    "storeName",
    "name",
    "title",
  ]);

  if (!id || !name) {
    return null;
  }

  const location = getTextField(raw, [
    "distance",
    "city",
    "location",
    "address",
    "area",
  ]);

  const rawImage = getTextField(raw, [
    "imageUrl",
    "logoUrl",
    "image",
    "photoUrl",
  ]);

  return {
    id,
    name,
    distance: location || "Nearby",
    image:
      rawImage ||
      `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`,
  };
}

/* --------------------------------
 * Validate text
 * -------------------------------- */
function getSafeText(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  return value.trim();
}

/* --------------------------------
 * Validate image URL
 * -------------------------------- */
function getSafeImageUrl(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  const imageUrl = value.trim();

  if (!imageUrl) {
    return "";
  }

  try {
    const url = new URL(imageUrl);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

/* --------------------------------
 * Validate store
 * -------------------------------- */
function isValidStore(
  value: unknown,
): value is NearStore {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const store = value as Record<string, unknown>;

  return (
    (typeof store.id === "string" ||
      typeof store.id === "number") &&
    typeof store.image === "string" &&
    store.image.trim().length > 0 &&
    typeof store.name === "string" &&
    store.name.trim().length > 0 &&
    typeof store.distance === "string" &&
    store.distance.trim().length > 0
  );
}

/* --------------------------------
 * Static fallback (STORE_DISCOUNTS)
 * -------------------------------- */
function mapStaticStores(): NearStore[] {
  if (!Array.isArray(STORE_DISCOUNTS)) {
    return [];
  }

  return STORE_DISCOUNTS.filter(isValidStore).map((store) => ({
    id: String(store.id),
    image: store.image,
    name: store.name,
    distance: store.distance,
  }));
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function StoresNearYouMap() {
  const [stores, setStores] = useState<NearStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  /* --------------------------------
   * Live stores — #100 storesApi.list()
   * Falls back to static STORE_DISCOUNTS
   * when the API is unreachable/empty.
   * -------------------------------- */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const { data } = await storesApi.list(1, 25);
        const live = extractStoreRows(data)
          .map(mapStoreRow)
          .filter(
            (store): store is NearStore => store !== null,
          );

        if (!cancelled) {
          setStores(live.length > 0 ? live : mapStaticStores());
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setStores(mapStaticStores());
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* --------------------------------
   * Validate store list
   * -------------------------------- */
  const safeStores = stores.filter(isValidStore);

  /* --------------------------------
   * Get nearest store safely
   * -------------------------------- */
  const nearest = safeStores[0];
  const visiblePins = PIN_POSITIONS.slice(
    0,
    Math.max(Math.min(safeStores.length, PIN_POSITIONS.length), 1),
  );

  return (
    <aside
      className="
        bg-white
        border
        border-line
        rounded-card
        overflow-hidden
        sticky
        top-4
      "
      aria-labelledby="stores-near-you-title"
    >
      {/* --------------------------------
       * Header
       * -------------------------------- */}
      <div
        className="
          flex
          items-center
          justify-between
          px-4
          py-3
          border-b
          border-line
        "
      >
        <h3
          id="stores-near-you-title"
          className="
            text-[13.5px]
            font-bold
            text-ink
          "
        >
          Stores Near You
        </h3>

        <button
          type="button"
          className="
            text-[11.5px]
            text-blue
            font-semibold
            cursor-pointer
            hover:underline
            rounded
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
          "
          aria-label="Expand map"
        >
          Expand Map
        </button>
      </div>

      {/* --------------------------------
       * Map
       * -------------------------------- */}
      <div
        className="
          relative
          h-[220px]
          bg-cover
          bg-center
          bg-paper
        "
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80)",
        }}
        aria-label="Map showing stores near you"
      >
        {/* Map Overlay */}
        <div
          className="
            absolute
            inset-0
            bg-navy/20
          "
          aria-hidden="true"
        />

        {/* Store Pins */}
        {visiblePins.map(
          (position, index) => (
            <span
              key={`${position.top}-${position.left}-${index}`}
              className="
                absolute
                w-7
                h-7
                -translate-x-1/2
                -translate-y-full
                rounded-full
                bg-navy
                border-2
                border-white
                shadow-pop
                flex
                items-center
                justify-center
                text-white
              "
              style={{
                top: position.top,
                left: position.left,
              }}
              aria-hidden="true"
            >
              <MapPin
                size={13}
                className="fill-white"
                aria-hidden="true"
              />
            </span>
          ),
        )}

        {/* User Location */}
        <span
          className="
            absolute
            w-3.5
            h-3.5
            rounded-full
            bg-blue
            border-2
            border-white
            shadow-pop
            top-1/2
            left-1/2
            -translate-x-1/2
            -translate-y-1/2
          "
          aria-label="Your current location"
        />
      </div>

      {/* --------------------------------
       * Nearest Store
       * -------------------------------- */}
      <div className="p-4">
        {loading ? (
          <div
            className="flex items-center gap-3"
            role="status"
            aria-live="polite"
            aria-label="Loading nearby stores"
          >
            <div className="w-14 h-14 rounded-lg bg-paper-deep animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 rounded bg-paper-deep animate-pulse w-3/4" />
              <div className="h-2.5 rounded bg-paper-deep animate-pulse w-1/2" />
            </div>
          </div>
        ) : nearest ? (
          <div className="flex items-center gap-3">
            {/* Store Image */}
            <div
              className="
                w-14
                h-14
                rounded-lg
                bg-cover
                bg-center
                bg-paper
                shrink-0
              "
              style={
                getSafeImageUrl(nearest.image)
                  ? {
                      backgroundImage: `url("${getSafeImageUrl(
                        nearest.image,
                      )}")`,
                    }
                  : undefined
              }
              aria-label={`${getSafeText(
                nearest.name,
                "Store",
              )} image`}
            />

            {/* Store Details */}
            <div
              className="
                min-w-0
                flex-1
              "
            >
              <div
                className="
                  text-[12.5px]
                  font-bold
                  text-ink
                  truncate
                "
              >
                {getSafeText(
                  nearest.name,
                  "Store",
                )}
              </div>

              <div
                className="
                  text-[11px]
                  text-ink-soft
                  mt-0.5
                "
              >
                {getSafeText(
                  nearest.distance,
                  "Distance unavailable",
                )}
              </div>

              {loadError && (
                <div className="text-[10px] text-amber-600 mt-0.5">
                  Live data unavailable — showing saved stores.
                </div>
              )}
            </div>

            {/* Directions */}
            <button
              type="button"
              className="
                shrink-0
                w-8
                h-8
                rounded-lg
                bg-paper
                border
                border-line
                flex
                items-center
                justify-center
                text-navy
                hover:border-navy
                transition-colors
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue
                focus-visible:ring-offset-2
              "
              aria-label={`Get directions to ${getSafeText(
                nearest.name,
                "store",
              )}`}
            >
              <Navigation
                size={13}
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <div
            className="
              min-h-[56px]
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-[12px]
              text-ink-faint
              text-center
            "
            role="status"
            aria-live="polite"
          >
            <span>
              {loadError
                ? "Could not load nearby stores. Please try again later."
                : "No nearby stores available."}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
