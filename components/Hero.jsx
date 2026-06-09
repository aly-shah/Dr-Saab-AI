import PhoneMockup from "./PhoneMockup";
import { WhatsAppIcon, ArrowRightIcon, CheckCircleIcon } from "./icons";

const WHATSAPP_URL = "/bot";

// Small green trend pill with a clean diagonal arrow (no unicode glyphs).
function TrendPill({ dir = "down", children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-[3px] text-[11px] font-semibold text-accent">
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dir === "down" ? (
          <>
            <path d="M3 4.5 9 9" />
            <path d="M9 5.5V9H5.5" />
          </>
        ) : (
          <>
            <path d="M3 7.5 9 3" />
            <path d="M5.5 3H9v3.5" />
          </>
        )}
      </svg>
      {children}
    </span>
  );
}

// Tiny descending sparkline for the fasting-sugar trend.
function Sparkline() {
  const pts = [20, 16, 17, 12, 13, 9, 7];
  const w = 60;
  const h = 22;
  const step = w / (pts.length - 1);
  const coords = pts.map((p, i) => [i * step, p]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-16" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="#05966910" />
      <path d={line} stroke="url(#spark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.4" fill="#059669" />
    </svg>
  );
}

// Minimal circular progress ring for time-in-range.
function ProgressRing({ value }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative h-12 w-12 flex-none">
      <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r={r} fill="none" stroke="#E8F1F6" strokeWidth="4" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="url(#ring)" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[13px] font-bold text-ink">
        {value}%
      </span>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-light/25 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-cloud" />
      </div>

      <div className="container-page grid items-center gap-12 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24">
        {/* Left: copy */}
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Manage and prevent diabetes,{" "}
            <span className="text-gradient">one message at a time.</span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Dr Saab AI lives right inside WhatsApp — no new app to download. Log
            your sugar readings, snap a photo of your meal, and get gentle,
            doctor-informed guidance to bring your numbers down and keep them
            there.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={WHATSAPP_URL} className="btn-primary">
              <WhatsAppIcon className="h-5 w-5" />
              Chat with Dr Saab AI
            </a>
            <a href="#how" className="btn-secondary">
              See how it works
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink/70">
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" />
              No app to install
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" />
              Private &amp; encrypted
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" />
              Free to start
            </li>
          </ul>
        </div>

        {/* Right: phone + floating cards */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-light/30 to-accent/20 blur-2xl" />

          <div className="animate-floaty">
            <PhoneMockup />
          </div>

          {/* Floating stat card — top left: fasting sugar trend */}
          <div className="absolute -left-4 top-12 hidden w-44 rounded-2xl bg-white/80 p-3.5 shadow-card ring-1 ring-white/60 backdrop-blur-md sm:block">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                Fasting sugar
              </p>
              <TrendPill dir="down">16</TrendPill>
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <p className="text-2xl font-bold leading-none text-ink">
                142<span className="ml-1 text-[11px] font-medium text-ink/40">mg/dL</span>
              </p>
              <Sparkline />
            </div>
          </div>

          {/* Floating stat card — bottom right: time in range */}
          <div className="absolute -right-4 bottom-14 hidden w-44 rounded-2xl bg-white/80 p-3.5 shadow-card ring-1 ring-white/60 backdrop-blur-md sm:block">
            <div className="flex items-center gap-3">
              <ProgressRing value={78} />
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                  Time in range
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-ink">This week</p>
                <TrendPill dir="up">12% better</TrendPill>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
