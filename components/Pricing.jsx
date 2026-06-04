import { CheckIcon, WhatsAppIcon, SparkleIcon } from "./icons";

const WHATSAPP_URL =
  "https://wa.me/10000000000?text=Hi%20Dr%20Saab%20AI%2C%20I%20want%20to%20take%20control%20of%20my%20blood%20sugar";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    desc: "Everything you need to begin managing your sugar today.",
    features: [
      "Daily blood-sugar logging",
      "Meal photo analysis (3/day)",
      "General diabetes Q&A",
      "Movement & hydration nudges",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Plus",
    price: "$9",
    period: "/ month",
    desc: "Deeper coaching for steady, lasting results.",
    features: [
      "Everything in Starter",
      "Unlimited meal analysis",
      "Personalised weekly plans",
      "Medication & refill reminders",
      "Doctor-ready PDF summaries",
      "Priority instant responses",
    ],
    cta: "Start 14-day free trial",
    featured: true,
  },
  {
    name: "Family",
    price: "$19",
    period: "/ month",
    desc: "Care for everyone you love, in one place.",
    features: [
      "Everything in Plus",
      "Up to 5 family members",
      "Caregiver progress updates",
      "Shared meal & shopping plans",
    ],
    cta: "Protect your family",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            Simple pricing
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Start free. Upgrade only if it helps.
          </h2>
          <p className="mt-4 text-lg text-ink/65">
            No insurance forms, no commitments. Begin in WhatsApp today and grow
            into more support whenever you&apos;re ready.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`reveal relative flex flex-col rounded-4xl p-8 ${
                p.featured
                  ? "bg-gradient-to-b from-primary to-primary-dark text-white shadow-card ring-1 ring-primary/40 lg:-translate-y-3"
                  : "card"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-soft">
                  Most popular
                </span>
              )}
              <h3 className={`text-lg font-semibold ${p.featured ? "text-white" : "text-ink"}`}>
                {p.name}
              </h3>
              <div className="mt-3 flex items-end gap-1.5">
                <span className={`text-4xl font-bold ${p.featured ? "text-white" : "text-ink"}`}>
                  {p.price}
                </span>
                <span className={`pb-1 text-sm ${p.featured ? "text-cyan-100/80" : "text-ink/50"}`}>
                  {p.period}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-relaxed ${p.featured ? "text-cyan-50/85" : "text-ink/60"}`}>
                {p.desc}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full ${
                        p.featured ? "bg-white/20 text-white" : "bg-accent/12 text-accent"
                      }`}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className={p.featured ? "text-cyan-50/90" : "text-ink/75"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 ${
                  p.featured
                    ? "btn bg-white text-primary shadow-soft hover:-translate-y-0.5 hover:shadow-card"
                    : "btn-primary"
                }`}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
