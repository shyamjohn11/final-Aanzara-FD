import type { DealCardData } from "@/app/data/nearbyDiscounts";
import DealCard from "./DealCard";

interface DealsSectionProps {
  title: string;
  deals: DealCardData[];
}

/**
 * Runtime validation
 */
function isValidDeal(deal: unknown): deal is DealCardData {
  return (
    deal !== null &&
    typeof deal === "object" &&
    !Array.isArray(deal)
  );
}

/**
 * Creates a unique and safe React key.
 */
function getDealKey(
  deal: DealCardData,
  index: number,
  usedKeys: Set<string>,
): string {
  const id = deal?.id;

  const baseKey =
    id !== undefined &&
    id !== null &&
    String(id).trim() !== ""
      ? String(id).trim()
      : `deal-${index}`;

  let key = baseKey;
  let count = 1;

  while (usedKeys.has(key)) {
    key = `${baseKey}-${count}`;
    count++;
  }

  usedKeys.add(key);

  return key;
}

export default function DealsSection({
  title,
  deals,
}: DealsSectionProps) {
  // -----------------------------
  // Validate title
  // -----------------------------
  const safeTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : "Deals";

  // -----------------------------
  // Validate deals
  // -----------------------------
  const safeDeals: DealCardData[] = Array.isArray(deals)
    ? deals.filter(isValidDeal)
    : [];

  // -----------------------------
  // Prevent duplicate React keys
  // -----------------------------
  const usedKeys = new Set<string>();

  return (
    <section
      aria-labelledby="deals-section-title"
      className="w-full"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="deals-section-title"
          className="
            font-sora
            font-bold
            text-[18px]
            sm:text-[19px]
            text-navy
          "
        >
          {safeTitle}
        </h2>

        <button
          type="button"
          className="
            text-[12px]
            font-semibold
            text-blue
            hover:underline
            shrink-0
            cursor-pointer
            rounded
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
          "
          aria-label={`See all ${safeTitle}`}
        >
          See All {safeTitle}
        </button>
      </div>

      {/* Deals */}
      {safeDeals.length > 0 ? (
        <div
          className="
            flex
            sm:grid
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
            overflow-x-auto
            scrollbar-none
            pb-1
          "
        >
          {safeDeals.map((deal, index) => {
            if (!isValidDeal(deal)) {
              return null;
            }

            const dealKey = getDealKey(
              deal,
              index,
              usedKeys,
            );

            return (
              <DealCard
                key={dealKey}
                deal={deal}
              />
            );
          })}
        </div>
      ) : (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[120px]
            w-full
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No deals available right now.
        </div>
      )}
    </section>
  );
}