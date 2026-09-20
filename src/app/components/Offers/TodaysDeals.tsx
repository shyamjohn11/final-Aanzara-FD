"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";

import {
  todayDealToCartProduct,
  type TodayDeal as TodayDealType,
} from "@/app/data/offers";
import { productsApi } from "@/app/api/services";

import { useCart } from "@/app/context/cartcontext";

/* --------------------------------
 * Types
 * -------------------------------- */

type TodayDeal = TodayDealType;

interface CountdownTime {
  d: number;
  h: number;
  m: number;
}

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

function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
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

function isValidTodayDeal(
  deal: unknown,
): deal is TodayDeal {
  if (
    !deal ||
    typeof deal !== "object" ||
    Array.isArray(deal)
  ) {
    return false;
  }

  const item =
    deal as Record<string, unknown>;

  return (
    isValidId(item.id) &&
    isValidText(item.brand) &&
    isValidText(item.name) &&
    isValidText(item.pack) &&
    isValidText(item.swatch) &&
    isValidText(item.accent) &&
    isValidNumber(item.discount) &&
    item.discount > 0 &&
    item.discount <= 100 &&
    isValidNumber(item.price) &&
    item.price >= 0 &&
    isValidNumber(item.mrp) &&
    item.mrp >= 0 &&
    item.price <= item.mrp
  );
}

/* --------------------------------
 * Safe Deals
 * -------------------------------- */

function getSafeTodayDeals(
  deals: unknown,
): TodayDeal[] {
  if (!Array.isArray(deals)) {
    return [];
  }

  const usedIds = new Set<string>();

  return (deals as unknown[])
    .filter(isValidTodayDeal)
    .map((deal) => ({
      ...deal,
      brand: deal.brand.trim(),
      name: deal.name.trim(),
      pack: deal.pack.trim(),
      swatch: deal.swatch.trim(),
      accent: deal.accent.trim(),
    }))
    .filter((deal) => {
      const id = String(deal.id)
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
 * API mapping (productsApi.popular)
 * -------------------------------- */

const DEAL_SWATCHES = [
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
];

const DEAL_ACCENTS = [
  "#1E40AF",
  "#047857",
  "#B45309",
  "#B91C1C",
  "#6D28D9",
  "#0E7490",
  "#BE185D",
  "#4D7C0F",
];

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

function mapPopularToTodayDeal(
  raw: Record<string, unknown>,
  index: number,
): TodayDeal {
  const id =
    String(
      raw.productId ??
        raw.id ??
        raw._id ??
        raw.sku ??
        `deal-${index}`,
    ).trim() || `deal-${index}`;

  const brand =
    String(
      raw.brand ??
        raw.brandName ??
        "Aanzara",
    ).trim() || "Aanzara";

  const name =
    String(
      raw.name ??
        raw.productName ??
        raw.title ??
        "Product",
    ).trim() || "Product";

  const pack =
    String(
      raw.pack ??
        raw.packSize ??
        raw.unit ??
        raw.qty ??
        "Standard Pack",
    ).trim() || "Standard Pack";

  let price = Number(
    raw.price ??
      raw.sellingPrice ??
      raw.offerPrice ??
      raw.salePrice ??
      0,
  );
  let mrp = Number(
    raw.mrp ??
      raw.retailPrice ??
      raw.originalPrice ??
      raw.totalPrice ??
      0,
  );
  let discount = Number(
    raw.discount ??
      raw.discountPercent ??
      raw.discountValue ??
      raw.percent ??
      0,
  );

  if (!Number.isFinite(price) || price < 0) price = 0;
  if (!Number.isFinite(mrp) || mrp < 0) mrp = 0;
  if (!Number.isFinite(discount) || discount < 0) discount = 0;

  if (mrp <= 0 && price > 0 && discount > 0 && discount < 100) {
    mrp = Math.round(price / (1 - discount / 100));
  }
  if (mrp <= 0 && price > 0) {
    mrp = price;
  }
  if (price <= 0 && mrp > 0 && discount > 0 && discount < 100) {
    price = Math.round(mrp * (1 - discount / 100));
  }
  if (discount <= 0 && mrp > price && mrp > 0) {
    discount = Math.round(((mrp - price) / mrp) * 100);
  }

  const swatchRaw = String(raw.swatch ?? raw.color ?? "").trim();
  const accentRaw = String(raw.accent ?? raw.secondaryColor ?? "").trim();
  // Enriched product images arrive as /api/v1/products/{id}/images/{imageId}/file (proxied via /api)
  const imageRaw = String(raw.imageUrl ?? raw.image ?? raw.thumbnail ?? "").trim();

  return {
    id,
    brand,
    name,
    pack,
    swatch: swatchRaw || DEAL_SWATCHES[index % DEAL_SWATCHES.length],
    accent: accentRaw || DEAL_ACCENTS[index % DEAL_ACCENTS.length],
    discount,
    price,
    mrp,
    image: imageRaw || undefined,
  };
}

/* --------------------------------
 * Countdown Hook
 * -------------------------------- */

function useCountdown(): CountdownTime {
  const [time, setTime] =
    useState<CountdownTime>({
      d: 2,
      h: 14,
      m: 32,
    });

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setTime((current) => {
          let {
            d,
            h,
            m,
          } = current;

          if (
            d === 0 &&
            h === 0 &&
            m === 0
          ) {
            return {
              d: 0,
              h: 0,
              m: 0,
            };
          }

          m -= 1;

          if (m < 0) {
            m = 59;
            h -= 1;
          }

          if (h < 0) {
            h = 23;
            d -= 1;
          }

          if (d < 0) {
            return {
              d: 0,
              h: 0,
              m: 0,
            };
          }

          return {
            d,
            h,
            m,
          };
        });
      }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return time;
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function TodaysDeals() {
  const {
    d,
    h,
    m,
  } = useCountdown();

  const { addToCart } =
    useCart();

  const router =
    useRouter();

  const [deals, setDeals] = useState<TodayDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await productsApi.popular(8);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapPopularToTodayDeal);
        if (!cancelled) {
          setDeals(mapped);
        }
      } catch (error) {
        console.error("Unable to load today's deals:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load today's deals. Please try again.",
          );
          setDeals([]);
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

  const safeDeals = useMemo(
    () => getSafeTodayDeals(deals),
    [deals],
  );

  const [cartError, setCartError] =
    useState<string>("");

  /* --------------------------------
   * Shop Now
   * -------------------------------- */

  const handleShopNow = (
    deal: TodayDeal,
  ): void => {
    setCartError("");

    if (!isValidTodayDeal(deal)) {
      setCartError(
        "This deal is currently unavailable.",
      );
      return;
    }

    try {
      const cartProduct =
        todayDealToCartProduct(
          deal,
        );

      if (!cartProduct) {
        throw new Error(
          "Unable to convert deal to cart product.",
        );
      }

      addToCart(cartProduct);
      router.push("/cart");
    } catch {
      setCartError(
        "Unable to add this deal to your cart. Please try again.",
      );
    }
  };

  /* --------------------------------
   * Render
   * -------------------------------- */

  return (
    <section
      aria-labelledby="todays-deals-title"
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          mb-4
          flex-wrap
          gap-2
        "
      >
        <div>
          <h2
            id="todays-deals-title"
            className="
              font-sora
              font-bold
              text-[19px]
              text-navy
            "
          >
            Today's Deals
          </h2>

          <span
            className="
              text-[11.5px]
              text-ink-faint
            "
          >
            Refreshed daily at midnight
          </span>
        </div>

        {/* Countdown */}
        <span
          className="
            flex
            items-center
            gap-1.5
            bg-navy
            text-white
            text-[11.5px]
            font-bold
            px-3
            py-2
            rounded-lg
          "
          role="timer"
          aria-label={`Deals end in ${d} days, ${h} hours, and ${m} minutes`}
        >
          <Timer
            size={13}
            aria-hidden="true"
          />

          ENDS IN{" "}
          {String(d).padStart(2, "0")}
          D :{" "}
          {String(h).padStart(2, "0")}
          H :{" "}
          {String(m).padStart(2, "0")}
          M
        </span>
      </div>

      {/* Error */}
      {cartError && (
        <div
          className="
            mb-4
            text-[11.5px]
            text-red-600
          "
          role="alert"
        >
          {cartError}
        </div>
      )}

      {fetchError && (
        <div
          className="
            mb-4
            text-[11.5px]
            text-red-600
          "
          role="alert"
        >
          {fetchError}
        </div>
      )}

      {loading ? (
        <div
          className="
            min-h-[150px]
            bg-white
            border
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading today's deals…
        </div>
      ) : (
        /* Deals */
        safeDeals.length > 0 ? (
          <div
            className="
              grid
              grid-cols-2
              lg:grid-cols-4
              gap-4
            "
          >
            {safeDeals.map((deal) => {
              const dealId =
                String(deal.id).trim();

              return (
                <article
                  key={dealId}
                  className="
                    bg-white
                    border
                    border-line
                    rounded-card
                    overflow-hidden
                    flex
                    flex-col
                    hover:shadow-pop
                    transition-shadow
                  "
                >
                  {/* Product Visual */}
                  <div
                    className="
                      relative
                      h-[130px]
                      flex
                      items-center
                      justify-center
                    "
                    style={{
                      background: `linear-gradient(
                        160deg,
                        ${deal.swatch}22,
                        ${deal.swatch}0D
                      )`,
                    }}
                  >
                    {/* Discount */}
                    <span
                      className="
                        absolute
                        top-2.5
                        left-2.5
                        bg-red-600
                        text-white
                        text-[10.5px]
                        font-bold
                        px-2
                        py-1
                        rounded-md
                      "
                    >
                      {deal.discount}% OFF
                    </span>

                    {/* Product Visual — real image when available (otherwise gradient placeholder) */}
                    {deal.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={deal.image}
                          alt={deal.name}
                          className="w-20 h-20 object-contain drop-shadow-sm"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.style.display = "none";
                            const fallback = img.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div
                          className="hidden w-12 h-[72px] rounded-sm shadow-sm"
                          aria-hidden="true"
                          style={{
                            background: `linear-gradient(160deg, ${deal.swatch}, ${deal.accent})`,
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="w-12 h-[72px] rounded-sm shadow-sm"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(160deg, ${deal.swatch}, ${deal.accent})`,
                        }}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div
                    className="
                      p-3.5
                      flex
                      flex-col
                      flex-1
                    "
                  >
                    {/* Brand */}
                    <span
                      className="
                        text-[10px]
                        font-bold
                        tracking-wide
                        text-ink-soft
                      "
                    >
                      {deal.brand}
                    </span>

                    {/* Name */}
                    <h3
                      className="
                        text-[12.5px]
                        font-bold
                        text-ink
                        leading-snug
                        mt-0.5
                        line-clamp-2
                        min-h-[32px]
                      "
                    >
                      {deal.name}
                    </h3>

                    {/* Pack */}
                    <p
                      className="
                        text-[10.5px]
                        text-ink-faint
                        mt-1
                      "
                    >
                      {deal.pack}
                    </p>

                    {/* Price */}
                    <div
                      className="
                        flex
                        items-baseline
                        gap-1.5
                        mt-2
                      "
                    >
                      <span
                        className="
                          text-[15px]
                          font-extrabold
                          text-navy
                        "
                      >
                        ₹
                        {deal.price.toLocaleString(
                          "en-IN",
                        )}
                      </span>

                      <span
                        className="
                          text-[11px]
                          text-ink-faint
                          line-through
                        "
                      >
                        ₹
                        {deal.mrp.toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() =>
                        handleShopNow(
                          deal,
                        )
                      }
                      aria-label={`Shop ${deal.name} now`}
                      className="
                        mt-auto
                        bg-navy
                        hover:bg-navy-deep
                        transition-colors
                        text-white
                        text-[11.5px]
                        font-bold
                        py-2.5
                        rounded-lg
                        mt-3
                        cursor-pointer
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-navy
                        focus-visible:ring-offset-2
                      "
                    >
                      Shop Now
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div
            className="
              min-h-[150px]
              bg-white
              border
              border-dashed
              border-line
              rounded-card
              flex
              items-center
              justify-center
              text-center
              px-4
              text-[12px]
              text-ink-faint
            "
            role="status"
            aria-live="polite"
          >
            No deals are available right
            now.
          </div>
        )
      )}
    </section>
  );
}
