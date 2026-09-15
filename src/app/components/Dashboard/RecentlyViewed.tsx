"use client";

import { useEffect, useState } from "react";
import { loadAllProductSnapshots } from "@/app/api/productcache";
import type { Product } from "@/app/data/products";

type RecentlyViewedProps = {
  user?: string;
};

export default function RecentlyViewed({
  user = "You",
}: RecentlyViewedProps) {
  const safeUser = user.trim() || "You";

  /* ============================================================
     RECENTLY VIEWED — driven by the local product snapshot cache
     (populated whenever real products enter the cart/wishlist).
  ============================================================ */

  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    setRecent(loadAllProductSnapshots().slice(0, 8));
  }, []);

  /* ============================================================
     HIDE UNTIL THE VISITOR HAS ACTUALLY VIEWED PRODUCTS
  ============================================================ */

  if (recent.length === 0) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section aria-labelledby="recently-viewed-heading">
      <h2
        id="recently-viewed-heading"
        className="font-sora font-bold text-[16px] text-navy mb-4"
      >
        Recently Viewed by {safeUser}
      </h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {recent.map((item) => (
          <div
            key={item.id}
            className="
              flex
              items-center
              gap-3
              bg-white
              border
              border-line
              rounded-card
              p-3
              min-w-[220px]
              shrink-0
              hover:border-blue
              hover:shadow-card
              transition-all
            "
          >
            {/* Product Visual */}
            {item.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="
                  w-11
                  h-11
                  rounded-lg
                  shrink-0
                  object-contain
                "
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-11 h-11 rounded-lg shrink-0"
                style={{
                  background: item.swatch
                    ? `linear-gradient(160deg, ${item.swatch}, ${item.swatch}99)`
                    : "linear-gradient(160deg, #E5E7EB, #F3F4F6)",
                }}
              />
            )}

            {/* Product Details */}
            <div className="min-w-0 flex-1">
              <div
                title={item.name}
                className="
                  text-[12.5px]
                  font-semibold
                  text-ink
                  truncate
                "
              >
                {item.name}
              </div>

              <div className="
                text-[11px]
                font-semibold
                text-green-deep
                mt-0.5
              ">
                ₹{item.price.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
