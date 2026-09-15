import type { DealCardData } from "@/app/data/nearbyDiscounts";

interface DealCardProps {
  deal: DealCardData;
}

export default function DealCard({ deal }: DealCardProps) {
  // Full data validation
  if (!deal || typeof deal !== "object") {
    return null;
  }

  const image =
    typeof deal.image === "string" && deal.image.trim().length > 0
      ? deal.image
      : "/images/placeholder-deal.jpg";

  const tag =
    typeof deal.tag === "string" && deal.tag.trim().length > 0
      ? deal.tag
      : "DEAL";

  const tagColor =
    typeof deal.tagColor === "string" && deal.tagColor.trim().length > 0
      ? deal.tagColor
      : "#2563EB";

  const store =
    typeof deal.store === "string" && deal.store.trim().length > 0
      ? deal.store
      : "Store";

  const title =
    typeof deal.title === "string" && deal.title.trim().length > 0
      ? deal.title
      : "Special Offer";

  const meta =
    typeof deal.meta === "string" && deal.meta.trim().length > 0
      ? deal.meta
      : "";

  return (
    <article
      className="
        bg-white
        border border-line
        rounded-card
        overflow-hidden
        shrink-0
        w-[220px]
        sm:w-auto
        hover:shadow-pop
        transition-shadow
        duration-200
      "
    >
      {/* Deal Image */}
      <div
        className="relative h-[110px] bg-gray-100 bg-cover bg-center"
        style={{
          backgroundImage: `url("${image}")`,
        }}
        role="img"
        aria-label={`${title} - ${store}`}
      >
        {/* Deal Tag */}
        <span
          className="
            absolute
            top-2
            left-2
            text-white
            text-[9.5px]
            font-bold
            tracking-wide
            px-2
            py-1
            rounded-md
          "
          style={{
            backgroundColor: tagColor,
          }}
        >
          {tag}
        </span>
      </div>

      {/* Deal Content */}
      <div className="p-3">
        {/* Store */}
        <div
          className="
            text-[10.5px]
            font-semibold
            text-ink-faint
            truncate
          "
          title={store}
        >
          {store}
        </div>

        {/* Deal Title */}
        <div
          className="
            text-[12.5px]
            font-bold
            text-ink
            leading-snug
            mt-0.5
            line-clamp-2
            min-h-[32px]
          "
          title={title}
        >
          {title}
        </div>

        {/* Meta */}
        {meta && (
          <div
            className="
              text-[11px]
              text-ink-soft
              mt-1.5
              truncate
            "
            title={meta}
          >
            {meta}
          </div>
        )}
      </div>
    </article>
  );
}