import Image from "next/image";
import { WhatsAppIcon } from "./icons";

/* ---- small inline glyphs for realism ---- */

function Ticks() {
  return (
    <svg viewBox="0 0 18 11" className="ml-1 inline h-[11px] w-[16px] text-sky-500" fill="none" aria-hidden="true">
      <path d="M1 6 4 9 9.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 9 12 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Signal() {
  return (
    <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="0.6" />
      <rect x="5" y="5" width="3" height="7" rx="0.6" />
      <rect x="10" y="2.5" width="3" height="9.5" rx="0.6" />
      <rect x="15" y="0" width="3" height="12" rx="0.6" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg viewBox="0 0 16 12" className="h-3 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 11.2 9.7 9.1a2.2 2.2 0 0 0-3.4 0L8 11.2Z" />
      <path d="M8 6.4c1.5 0 2.9.6 3.9 1.6l1.3-1.6A7.5 7.5 0 0 0 8 4a7.5 7.5 0 0 0-5.2 2.4l1.3 1.6A5.3 5.3 0 0 1 8 6.4Z" opacity="0.9" />
      <path d="M8 1.3c2.5 0 4.8 1 6.5 2.6L16 2.2A11 11 0 0 0 8 -1 11 11 0 0 0 0 2.2l1.5 1.7A9 9 0 0 1 8 1.3Z" opacity="0.7" />
    </svg>
  );
}

function Battery() {
  return (
    <svg viewBox="0 0 26 13" className="h-3 w-[26px]" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke="currentColor" opacity="0.5" />
      <rect x="2" y="2" width="17" height="9" rx="1.6" fill="currentColor" />
      <rect x="24" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function HeaderIcon({ children }) {
  return (
    <span className="grid h-8 w-8 place-items-center text-white/90" aria-hidden="true">
      {children}
    </span>
  );
}

/* ---- chat bubbles with WhatsApp-style tails ---- */

function Incoming({ children, time, tail = true }) {
  return (
    <div className="flex justify-start">
      <div className="relative max-w-[80%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-[12.5px] leading-snug text-slate-700 shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
        {tail && (
          <span className="absolute -left-[6px] top-0 h-3 w-3 overflow-hidden">
            <span className="absolute right-0 top-0 h-3 w-3 origin-top-right rotate-45 bg-white" />
          </span>
        )}
        <span>{children}</span>
        <span className="ml-2 inline-block align-bottom text-[9.5px] text-slate-400">{time}</span>
      </div>
    </div>
  );
}

function Outgoing({ children, time }) {
  return (
    <div className="flex justify-end">
      <div className="relative max-w-[80%] rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3 py-2 text-[12.5px] leading-snug text-slate-800 shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
        <span className="absolute -right-[6px] top-0 h-3 w-3 overflow-hidden">
          <span className="absolute left-0 top-0 h-3 w-3 origin-top-left -rotate-45 bg-[#d9fdd3]" />
        </span>
        <span>{children}</span>
        <span className="ml-1.5 inline-flex items-center align-bottom text-[9.5px] text-slate-500">
          {time}
          <Ticks />
        </span>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="relative flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
        <span className="absolute -left-[6px] top-0 h-3 w-3 overflow-hidden">
          <span className="absolute right-0 top-0 h-3 w-3 origin-top-right rotate-45 bg-white" />
        </span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-typing"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PhoneMockup({ className = "", contactName = "DrSaab AI", messages = null, rtl = false }) {
  return (
    <div className={`relative mx-auto w-[290px] sm:w-[320px] ${className}`}>
      {/* side buttons */}
      <span className="absolute -left-[3px] top-28 h-9 w-[3px] rounded-l bg-slate-800" aria-hidden="true" />
      <span className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l bg-slate-800" aria-hidden="true" />
      <span className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-slate-800" aria-hidden="true" />

      {/* titanium frame */}
      <div className="relative rounded-[3rem] bg-gradient-to-b from-slate-700 to-slate-900 p-[3px] shadow-card">
        <div className="rounded-[2.85rem] bg-slate-900 p-[9px]">
          <div className="relative overflow-hidden rounded-[2.3rem] bg-[#efeae2]">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-2 z-30 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />

            {/* status bar */}
            <div className="relative z-20 flex items-center justify-between bg-[#075E54] px-6 pb-1 pt-3 text-[11px] font-semibold text-white">
              <span className="tracking-tight">9:41</span>
              <div className="flex items-center gap-1.5">
                <Signal />
                <Wifi />
                <Battery />
              </div>
            </div>

            {/* WhatsApp chat header */}
            <div className="flex items-center gap-2.5 bg-[#075E54] px-3 pb-2.5 pt-1.5 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
              <div className="relative h-9 w-9 flex-none">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary-light to-accent text-white ring-2 ring-white/20">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#075E54] bg-emerald-400" />
              </div>
              <div className="flex-1 leading-tight">
                <p className="flex items-center gap-1 text-[13px] font-semibold">
                  {contactName}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-300" fill="currentColor" aria-hidden="true">
                    <path d="m9 12 2 2 4-4m-3-8 2.3 1.7 2.8-.3 1 2.7 2.4 1.6-1 2.6 1 2.6-2.4 1.6-1 2.7-2.8-.3L12 22l-2.3-1.7-2.8.3-1-2.7L3.5 16.3l1-2.6-1-2.6 2.4-1.6 1-2.7 2.8.3L12 2Z" opacity="0.25" />
                    <path d="m9.5 12.2 1.7 1.7 3.4-3.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </p>
                <p className="text-[10.5px] text-emerald-100/80">online</p>
              </div>
              <HeaderIcon>
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 10 4.5-3v10L15 14M4 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                </svg>
              </HeaderIcon>
              <HeaderIcon>
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1l-2.25 2.2Z" />
                </svg>
              </HeaderIcon>
            </div>

            {/* chat body — WhatsApp doodle background */}
            <div
              className="flex h-[392px] flex-col gap-2 overflow-hidden px-3 py-3 sm:h-[420px]"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage:
                  "radial-gradient(rgba(120,100,80,0.07) 1px, transparent 1.4px), radial-gradient(rgba(120,100,80,0.05) 1px, transparent 1.4px)",
                backgroundSize: "22px 22px, 22px 22px",
                backgroundPosition: "0 0, 11px 11px",
              }}
            >
              {messages ? (
                <>
                  <div className="mx-auto rounded-md bg-white/85 px-2.5 py-0.5 text-[9.5px] font-medium text-slate-500 shadow-sm">
                    TODAY
                  </div>
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === "out" ? "justify-end" : "justify-start"}`}>
                      <div
                        dir={rtl ? "rtl" : "ltr"}
                        className={`relative max-w-[82%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug shadow-[0_1px_1px_rgba(0,0,0,0.08)] ${
                          m.from === "out"
                            ? "rounded-tr-md bg-[#d9fdd3] text-slate-800"
                            : "rounded-tl-md bg-white text-slate-700"
                        }`}
                      >
                        <span>{m.text}</span>
                        <span className={`${rtl ? "mr-2" : "ml-2"} inline-block align-bottom text-[9.5px] text-slate-400`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
              <div className="mx-auto rounded-md bg-white/85 px-2.5 py-0.5 text-[9.5px] font-medium text-slate-500 shadow-sm">
                TODAY
              </div>
              <div className="mx-auto flex items-center gap-1 rounded-md bg-[#fdf3d4] px-2.5 py-1 text-center text-[9px] leading-tight text-amber-800/80 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 flex-none" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 0 1 6 0v3Z" /></svg>
                Messages are end-to-end encrypted
              </div>

              <Incoming time="9:38">Morning, Aisha 🌿 What did you have for breakfast?</Incoming>

              {/* meal photo message */}
              <div className="flex justify-end">
                <div className="relative max-w-[72%] overflow-hidden rounded-2xl rounded-tr-md bg-[#d9fdd3] p-1 shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
                  <span className="absolute -right-[6px] top-0 z-10 h-3 w-3 overflow-hidden">
                    <span className="absolute left-0 top-0 h-3 w-3 origin-top-left -rotate-45 bg-[#d9fdd3]" />
                  </span>
                  <Image
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80&auto=format&fit=crop"
                    alt="Photo of a healthy breakfast plate with egg, avocado and greens"
                    width={200}
                    height={150}
                    className="h-[112px] w-full rounded-[14px] object-cover"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center rounded-md bg-black/35 px-1.5 py-0.5 text-[9.5px] text-white">
                    9:39 <Ticks />
                  </span>
                </div>
              </div>

              <Incoming time="9:39">
                Lovely balance! ~22g carbs &amp; high fibre — this&apos;ll keep your sugar nice and steady 📊
              </Incoming>
              <Outgoing time="9:40">And my fasting reading was 142 this morning</Outgoing>
              <Incoming time="9:40">
                Down from 158 last week 📉 Really solid progress. I&apos;ll nudge you to recheck at 11am 👍
              </Incoming>
              <Typing />
                </>
              )}
            </div>

            {/* input bar */}
            <div className="flex items-center gap-2 bg-[#efeae2] px-2.5 py-2">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" strokeLinecap="round" /></svg>
                <span className="flex-1 text-[11.5px] text-slate-400">Message</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21 7-8.5 8.5a3.5 3.5 0 0 1-5-5L15 2.5a2.5 2.5 0 0 1 3.5 3.5l-8 8" /></svg>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m8 11 2.5 3L14 9.5 21 17" /><circle cx="8.5" cy="9" r="1" fill="currentColor" /></svg>
              </div>
              <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-whatsapp text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
                  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* soft screen glare */}
      <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-transparent via-white/0 to-white/10" />
    </div>
  );
}
