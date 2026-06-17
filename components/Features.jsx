import Image from "next/image";
import {
  SaladIcon,
  ChartIcon,
  StethoscopeIcon,
  HeartPulseIcon,
  CheckIcon,
  SparkleIcon,
} from "./icons";

function Bullets({ items }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3 text-[15px] text-ink/75">
          <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent/12 text-accent">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Copy({ icon: Icon, kicker, title, body, bullets }) {
  return (
    <div className="reveal max-w-lg">
      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-line">
        <Icon className="h-4 w-4" />
        {kicker}
      </span>
      <h3 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h3>
      <p className="mt-3 text-[16px] leading-relaxed text-ink/65">{body}</p>
      <Bullets items={bullets} />
    </div>
  );
}

function PhotoCard({ src, alt, badge }) {
  return (
    <div className="reveal relative">
      <div className="absolute -inset-4 -z-10 rounded-[2.4rem] bg-gradient-to-br from-primary-light/20 to-accent/15 blur-2xl" />
      <div className="overflow-hidden rounded-4xl shadow-card ring-1 ring-line/70">
        <Image
          src={src}
          alt={alt}
          width={720}
          height={560}
          className="h-full w-full object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      {badge}
    </div>
  );
}

function ChatBadge({ children }) {
  return (
    <div className="absolute -bottom-5 left-4 max-w-[78%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] leading-snug text-ink/80 shadow-card ring-1 ring-line/70 sm:left-8">
      {children}
    </div>
  );
}

/* Build a smooth (Catmull-Rom) SVG path through points */
function smoothPath(p) {
  let d = `M ${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* Custom in-range glucose trend chart (SVG, no external lib) */
function GlucoseChart() {
  const points = [158, 151, 149, 144, 140, 137, 134, 131];
  const max = 168;
  const min = 96;
  const padX = 6;
  const w = 320;
  const h = 150;
  const yOf = (v) => h - ((v - min) / (max - min)) * h;
  const step = (w - padX * 2) / (points.length - 1);
  const coords = points.map((v, i) => [padX + i * step, yOf(v)]);
  const line = smoothPath(coords);
  const area = `${line} L ${coords[coords.length - 1][0]},${h} L ${coords[0][0]},${h} Z`;
  const last = coords[coords.length - 1];

  const bandTop = yOf(130);
  const bandBottom = yOf(100);

  return (
    <div className="reveal relative">
      <div className="absolute -inset-4 -z-10 rounded-[2.4rem] bg-gradient-to-br from-accent/15 to-primary-light/20 blur-2xl" />
      <div className="card overflow-hidden p-6">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
              Morning blood sugar
            </p>
            <p className="mt-1 flex items-baseline gap-1.5 text-ink">
              <span className="text-[2rem] font-bold leading-none">131</span>
              <span className="text-sm font-medium text-ink/40">mg/dL</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4.5 9 9" />
              <path d="M9 5.5V9H5.5" />
            </svg>
            27 in 8 weeks
          </span>
        </div>

        {/* chart */}
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full overflow-visible" role="img" aria-label="Morning blood sugar trending smoothly downward from 158 to 131 mg/dL over eight weeks, settling into the healthy target range">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891B2" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* target range band */}
          <rect x="0" y={bandTop} width={w} height={bandBottom - bandTop} fill="#05966910" />
          <line x1="0" x2={w} y1={bandTop} y2={bandTop} stroke="#05966933" strokeWidth="1" strokeDasharray="2 4" />
          <line x1="0" x2={w} y1={bandBottom} y2={bandBottom} stroke="#05966933" strokeWidth="1" strokeDasharray="2 4" />
          <text x={w - 2} y={bandTop + 11} textAnchor="end" className="fill-accent/70" style={{ fontSize: "8.5px", fontWeight: 600 }}>
            TARGET
          </text>

          {/* area + line */}
          <path d={area} fill="url(#areaGrad)" />
          <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* intermediate points */}
          {coords.slice(0, -1).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" stroke="#0891B2" strokeWidth="1.6" />
          ))}

          {/* latest point + floating value tag */}
          <circle cx={last[0]} cy={last[1]} r="9" fill="#05966922" />
          <circle cx={last[0]} cy={last[1]} r="4.5" fill="#059669" stroke="#fff" strokeWidth="2" />
          <g transform={`translate(${last[0] - 20}, ${last[1] - 30})`}>
            <rect width="40" height="20" rx="6" fill="#164E63" />
            <text x="20" y="13.5" textAnchor="middle" fill="#fff" style={{ fontSize: "10px", fontWeight: 700 }}>
              131
            </text>
            <path d="M16 20 L20 25 L24 20 Z" fill="#164E63" />
          </g>
        </svg>

        {/* x-axis */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-ink/40">
          <span>Week 1</span>
          <span>Week 4</span>
          <span className="font-semibold text-accent">Now</span>
        </div>

        {/* mini stats */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-line/70 rounded-2xl bg-muted/50 py-3 text-center">
          {[
            { label: "Average", value: "138" },
            { label: "Lowest", value: "124" },
            { label: "In range", value: "78%" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-base font-bold text-ink">{s.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-cloud/60 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            What DrSaab does for you
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            A complete diabetes companion, built into your chats
          </h2>
          <p className="mt-4 text-lg text-ink/65">
            Everything you need to understand your body, eat with confidence, and
            keep your numbers in a healthy range — without spreadsheets or jargon.
          </p>
        </div>

        <div className="mt-20 flex flex-col gap-24 sm:gap-28">
          {/* Block 1 — Meals */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Copy
              icon={SaladIcon}
              kicker="Smart meals"
              title="Snap your plate, get a low-GI verdict"
              body="Send a photo of any meal and DrSaab estimates carbs and glycemic impact, then suggests simple swaps that fit your culture and budget."
              bullets={[
                "Instant carb & glycemic-load estimates from a photo",
                "Culturally familiar meal swaps and portion tips",
                "Grocery and recipe ideas tailored to your goals",
              ]}
            />
            <PhotoCard
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80&auto=format&fit=crop"
              alt="A colourful, balanced bowl of avocado, chickpeas and fresh vegetables"
              badge={
                <ChatBadge>
                  This bowl is ~22g carbs, high fibre. Great choice — pair it with
                  protein to keep your sugar steady. ✅
                </ChatBadge>
              }
            />
          </div>

          {/* Block 2 — Tracking (chart, image on left for alternation) */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <GlucoseChart />
            </div>
            <div className="order-1 lg:order-2 lg:justify-self-end">
              <Copy
                icon={ChartIcon}
                kicker="Clear insights"
                title="Watch your numbers fall into range"
                body="Just text your readings — DrSaab logs them, spots patterns, and shows your progress in plain language so you always know what's working."
                bullets={[
                  "Effortless logging by text or voice note",
                  "Trend spotting that flags spikes before they become habits",
                  "Weekly summaries you can share with your doctor",
                ]}
              />
            </div>
          </div>

          {/* Block 3 — Movement */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Copy
              icon={HeartPulseIcon}
              kicker="Gentle movement"
              title="Activity that fits your real life"
              body="No punishing workouts. Get bite-sized movement nudges — a 10-minute post-dinner walk, a stretch break — proven to lower blood sugar."
              bullets={[
                "Personalised, achievable daily movement goals",
                "Post-meal walk reminders that blunt sugar spikes",
                "Encouragement that adapts when life gets busy",
              ]}
            />
            <PhotoCard
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80&auto=format&fit=crop"
              alt="A woman exercising on a mat in a bright studio"
            />
          </div>

          {/* Block 4 — Doctor-informed */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <PhotoCard
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80&auto=format&fit=crop"
                alt="A doctor in a white coat with a stethoscope, holding a phone"
                badge={
                  <ChatBadge>
                    Your guidance is grounded in clinical diabetes guidelines —
                    and always reminds you when to see your doctor. 🩺
                  </ChatBadge>
                }
              />
            </div>
            <div className="order-1 lg:order-2 lg:justify-self-end">
              <Copy
                icon={StethoscopeIcon}
                kicker="Doctor-informed"
                title="Answers you can actually trust, any hour"
                body="Built on established clinical diabetes guidelines, DrSaab explains medications, symptoms and what your numbers mean — and never hesitates to point you to a real clinician."
                bullets={[
                  "Plain-language answers grounded in clinical guidelines",
                  "Safe escalation: clear prompts to seek urgent care",
                  "Medication and refill reminders you won't forget",
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
