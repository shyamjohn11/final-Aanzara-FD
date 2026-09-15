import {
  FileCheck2,
  Truck,
  Ticket,
  UserCog,
  ShieldCheck,
} from "lucide-react";

const ICONS = [FileCheck2, Truck, Ticket, UserCog, ShieldCheck];

export default function WhyChooseUs() {
  const WHY_AANZARA: { title: string; desc: string }[] = [];

  return (
    <div>
      <h2 className="font-sora font-bold text-[18px] text-navy text-center mb-5">
        Why Indian Enterprise Procures From Aanzara
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {WHY_AANZARA.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <div
              key={item.title}
              className="bg-white border border-line rounded-card p-4"
            >
              <span className="w-9 h-9 rounded-lg bg-blue/10 text-blue flex items-center justify-center mb-3">
                <Icon size={17} />
              </span>
              <div className="text-[13px] font-bold text-ink mb-1">
                {item.title}
              </div>
              <p className="text-[11.5px] text-ink-soft leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}