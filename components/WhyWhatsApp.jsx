import { WhatsAppIcon, GlobeIcon, ShieldIcon, ClockIcon, BellIcon } from "./icons";

const POINTS = [
  {
    icon: GlobeIcon,
    title: "Nothing to download",
    body: "It works in the app already on 2.7 billion phones. No app store, no storage worries, no learning curve.",
  },
  {
    icon: ShieldIcon,
    title: "Private by design",
    body: "Conversations are end-to-end encrypted by WhatsApp. Your health data stays between you and your coach.",
  },
  {
    icon: ClockIcon,
    title: "Always one tap away",
    body: "Right next to your family chats. Logging a reading or asking a question takes seconds, not menus.",
  },
  {
    icon: BellIcon,
    title: "Reminders that reach you",
    body: "Gentle nudges land where you already look a hundred times a day — so you actually follow through.",
  },
];

export default function WhyWhatsApp() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-dark to-ink text-white shadow-card">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-16">
            <div className="reveal">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25">
                <WhatsAppIcon className="h-4 w-4" />
                Why WhatsApp?
              </span>
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Care that meets you exactly where you already are
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-cyan-50/80">
                The best health tool is the one you&apos;ll actually use. By living
                inside WhatsApp, Dr Saab AI removes every excuse between you and a
                healthier day.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="reveal rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cyan-50/75">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
