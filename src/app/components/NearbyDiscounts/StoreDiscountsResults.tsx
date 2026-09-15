"use client";

import { useEffect, useState } from "react";
import {
  STORE_DISCOUNTS,
  type StoreDiscount,
} from "@/app/data/nearbyDiscounts";
import { storesApi, storeOffersApi } from "@/app/api/services";

import StoreDiscountCard from "./StoreDiscountCard";
import StoresNearYouMap from "./StoresNearYouMap";
import Pagination from "@/app/components/Dashboard/Pagination";

interface StoreDiscountsResultsProps {
  // Optional so the existing usage still works.
  stores?: typeof STORE_DISCOUNTS;
}

/* --------------------------------
 * Backend payload helpers
 * (#100 storesApi.list + #105 storeOffersApi.list —
 *  paginated or plain array)
 * -------------------------------- */
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "stores", "offers", "data"]) {
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

function getIdField(raw: Record<string, unknown>): string {
  for (const key of ["storeId", "offerId", "id"]) {
    const value = raw[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

const BADGE_COLORS = [
  "#2448C4",
  "#1E7A3C",
  "#E8641C",
  "#D63A6B",
  "#7C3AED",
];

function badgeColorFor(id: string, index: number): string {
  let hash = index;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

/* --------------------------------
 * Map backend store (+ optional offer)
 * rows to a renderable StoreDiscount
 * -------------------------------- */
function toStoreDiscount(
  store: Record<string, unknown>,
  offer: Record<string, unknown> | null,
  index: number,
): StoreDiscount | null {
  const storeId = getIdField(store);
  const storeName = getTextField(store, [
    "storeName",
    "name",
    "title",
  ]);

  if (!storeId || !storeName) {
    return null;
  }

  const category = getTextField(offer ?? {}, [
    "category",
    "categoryName",
    "offerCategory",
  ]) ||
    getTextField(store, ["category", "categoryName", "storeCategory"]) ||
    "Local Store";

  const badge = getTextField(offer ?? {}, [
    "badge",
    "discountText",
    "offerBadge",
  ]) ||
    getTextField(store, ["badge"]) ||
    "Special Offer";

  const title = getTextField(offer ?? {}, [
    "title",
    "offerTitle",
    "name",
  ]) || `${storeName} special offer`;

  const desc = getTextField(offer ?? {}, [
    "description",
    "details",
    "offerDescription",
    "message",
  ]) ||
    getTextField(store, ["description", "address", "city"]) ||
    "Visit the store to redeem this live offer.";

  const distance = getTextField(store, ["distance"]) ||
    getTextField(store, ["city", "location", "address", "area"]) ||
    "Nearby";

  const image = getTextField(offer ?? {}, [
    "imageUrl",
    "image",
    "bannerUrl",
  ]) ||
    getTextField(store, ["imageUrl", "logoUrl", "image", "photoUrl"]) ||
    `https://picsum.photos/seed/${encodeURIComponent(storeId)}/600/400`;

  const ratingRaw =
    (offer ?? {})["discountPercent"] ?? store["rating"] ?? store["averageRating"];

  const rating =
    typeof ratingRaw === "number" && Number.isFinite(ratingRaw)
      ? Math.min(Math.max(Math.round(ratingRaw), 0), 5)
      : 4;

  const validity = getTextField(offer ?? {}, [
    "validity",
    "validUntil",
    "validTill",
    "endDate",
  ]) || "Limited period";

  return {
    id: storeId,
    name: storeName,
    category,
    badge,
    badgeColor: badgeColorFor(storeId, index),
    status: "Open Now",
    rating,
    distance,
    title,
    desc,
    minPurchase: getTextField(offer ?? {}, [
      "minPurchase",
      "minimumPurchase",
      "terms",
    ]) || "No minimum purchase",
    validity,
    locations: getTextField(store, ["city", "location", "address"]) ||
      "Multiple locations",
    image,
    verified: Boolean(
      store["isVerified"] ?? store["verified"] ?? false,
    ),
  };
}

/* --------------------------------
 * Map an unmatched offer row to a
 * renderable StoreDiscount card
 * -------------------------------- */
function offerToStoreDiscount(
  offer: Record<string, unknown>,
  index: number,
): StoreDiscount | null {
  const offerId = getIdField(offer);

  if (!offerId) {
    return null;
  }

  const storeName = getTextField(offer, [
    "storeName",
    "store",
    "merchantName",
  ]) || "Partner Store";

  return toStoreDiscount(
    {
      id: offerId,
      storeName,
      city: getTextField(offer, ["city", "location"]),
      imageUrl: getTextField(offer, ["imageUrl", "image"]),
    },
    offer,
    index,
  );
}

/* --------------------------------
 * Runtime validation
 * -------------------------------- */
function isValidStore(
  store: unknown,
): store is (typeof STORE_DISCOUNTS)[number] {
  return (
    store !== null &&
    typeof store === "object" &&
    !Array.isArray(store)
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function StoreDiscountsResults({
  stores,
}: StoreDiscountsResultsProps) {
  const [liveStores, setLiveStores] = useState<StoreDiscount[]>([]);
  const [loading, setLoading] = useState(stores === undefined);
  const [loadError, setLoadError] = useState(false);

  /* --------------------------------
   * Live data — #100 stores + #105 offers.
   * Skipped when a `stores` prop is passed.
   * -------------------------------- */
  useEffect(() => {
    if (stores !== undefined) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const [storesRes, offersRes] = await Promise.all([
          storesApi.list(1, 25),
          storeOffersApi.list(1, 25),
        ]);

        const storeRows = extractRows(storesRes.data);
        const offerRows = extractRows(offersRes.data);

        const offerByStore = new Map<string, Record<string, unknown>>();
        const unmatchedOffers: Record<string, unknown>[] = [];

        for (const offer of offerRows) {
          const storeId = getTextField(offer, [
            "storeId",
            "store",
            "merchantId",
          ]);

          if (storeId && !offerByStore.has(storeId)) {
            offerByStore.set(storeId, offer);
          } else if (!storeId) {
            unmatchedOffers.push(offer);
          }
        }

        const mapped: StoreDiscount[] = storeRows
          .map((row, index) =>
            toStoreDiscount(
              row,
              offerByStore.get(getIdField(row)) ?? null,
              index,
            ),
          )
          .filter((item): item is StoreDiscount => item !== null);

        unmatchedOffers.forEach((offer, index) => {
          const mappedOffer = offerToStoreDiscount(
            offer,
            storeRows.length + index,
          );

          if (mappedOffer) {
            mapped.push(mappedOffer);
          }
        });

        if (!cancelled) {
          setLiveStores(mapped);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setLiveStores([]);
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
  }, [stores]);

  /* --------------------------------
   * Validate stores
   * -------------------------------- */
  const sourceStores =
    stores !== undefined
      ? stores
      : liveStores.length > 0 || loadError || !loading
        ? liveStores
        : STORE_DISCOUNTS;

  const safeStores = Array.isArray(sourceStores)
    ? sourceStores.filter(isValidStore)
    : [];

  return (
    <section
      className="w-full"
      aria-labelledby="store-discounts-title"
    >
      {/* --------------------------------
       * Header
       * -------------------------------- */}
      <div
        className="
          flex
          items-center
          justify-between
          mb-4
          gap-3
          flex-wrap
        "
      >
        <h2
          id="store-discounts-title"
          className="
            font-sora
            font-bold
            text-[18px]
            sm:text-[19px]
            text-navy
          "
        >
          Store Discounts
        </h2>

        <span
          className="
            text-[12px]
            text-ink-soft
          "
        >
          Live offers from Aanzara verified stores
        </span>
      </div>

      {/* --------------------------------
       * Load error notice
       * -------------------------------- */}
      {loadError && (
        <div
          role="alert"
          className="
            mb-4
            rounded-lg
            border
            border-amber-300
            bg-amber-50
            px-4
            py-3
            text-[12px]
            text-amber-800
          "
        >
          Live store offers could not be loaded. Showing available
          results instead.
        </div>
      )}

      {/* --------------------------------
       * Results + Map
       * -------------------------------- */}
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[1fr_320px]
          gap-6
          items-start
        "
      >
        {/* Store Results */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading store discounts"
              className="flex flex-col gap-4"
            >
              {[0, 1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="
                    bg-white
                    border
                    border-line
                    rounded-card
                    p-4
                    flex
                    flex-col
                    sm:flex-row
                    gap-4
                  "
                >
                  <div className="w-full sm:w-[220px] h-[160px] rounded-lg bg-paper-deep animate-pulse shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 rounded bg-paper-deep animate-pulse w-2/3" />
                    <div className="h-3 rounded bg-paper-deep animate-pulse w-1/3" />
                    <div className="h-2.5 rounded bg-paper-deep animate-pulse w-full" />
                    <div className="h-2.5 rounded bg-paper-deep animate-pulse w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : safeStores.length > 0 ? (
            safeStores.map((store, index) => {
              /*
               * Extra protection before rendering.
               */
              if (!isValidStore(store)) {
                return null;
              }

              const storeId =
                store.id !== undefined &&
                store.id !== null &&
                String(store.id).trim().length > 0
                  ? String(store.id).trim()
                  : `store-${index}`;

              return (
                <StoreDiscountCard
                  key={storeId}
                  store={store}
                />
              );
            })
          ) : (
            <div
              className="
                min-h-[160px]
                flex
                items-center
                justify-center
                border
                border-dashed
                border-line
                rounded-card
                bg-white
                px-5
                text-center
                text-[12px]
                text-ink-faint
              "
              role="status"
              aria-live="polite"
            >
              No store discounts available right now.
            </div>
          )}

          {/* Pagination */}
          {safeStores.length > 0 && (
            <div className="mt-2">
              <Pagination />
            </div>
          )}
        </div>

        {/* Map */}
        <StoresNearYouMap />
      </div>
    </section>
  );
}
