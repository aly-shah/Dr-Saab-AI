import { StarIcon } from "./icons";

const STATS = [
  { value: "12,000+", label: "people coached on WhatsApp" },
  { value: "−0.9%", label: "average HbA1c drop in 90 days*" },
  { value: "73%", label: "more days in healthy range" },
  { value: "24/7", label: "always-on, instant replies" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-line/60 bg-white/70">
      <div className="container-page py-10">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1 text-amber-400" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} className="h-5 w-5" />
            ))}
          </div>
          <p className="text-sm font-medium text-ink/70">
            Loved by <span className="font-semibold text-ink">4.9/5</span> from people
            taking back control of their health
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="reveal text-center">
              <dt className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-2 text-sm leading-snug text-ink/60">{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-center text-[11px] text-ink/40">
          *Illustrative outcomes for demonstration. Dr Saab AI supports — and never
          replaces — your doctor&apos;s care.
        </p>
      </div>
    </section>
  );
}
