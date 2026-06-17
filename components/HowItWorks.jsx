import { WhatsAppIcon, MessageIcon, ChartIcon, SparkleIcon } from "./icons";

const STEPS = [
  {
    icon: WhatsAppIcon,
    step: "01",
    title: "Say hi on WhatsApp",
    body: "Tap one button and message DrSaab. No sign-up forms, no downloads — your chat is ready in seconds.",
  },
  {
    icon: MessageIcon,
    step: "02",
    title: "Share your day",
    body: "Send your sugar readings, snap a photo of your plate, or just describe how you feel. Voice notes work too.",
  },
  {
    icon: ChartIcon,
    step: "03",
    title: "Get a personalised plan",
    body: "Receive friendly, doctor-informed guidance, meal swaps, and reminders tuned to your numbers and goals.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            How DrSaab Works
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            From confused to in control
          </h2>
          <p className="mt-4 text-lg text-ink/65">
            Managing blood sugar shouldn&apos;t feel like a full-time job. DrSaab
            makes it as simple as texting a friend who happens to know a lot about diabetes.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent md:block" />

          {STEPS.map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="reveal relative">
              <div className="relative z-10 mx-auto mb-6 grid h-16 w-16 place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-primary shadow-soft ring-1 ring-line">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-white shadow-soft">
                  {step}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-ink">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink/65">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
