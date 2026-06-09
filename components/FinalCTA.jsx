import { WhatsAppIcon, CheckCircleIcon } from "./icons";

const WHATSAPP_URL = "/bot";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary-light/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="container-page">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="relative mx-auto inline-flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-2xl bg-whatsapp/30 animate-pulse-ring" />
            <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-whatsapp text-white shadow-card">
              <WhatsAppIcon className="h-8 w-8" />
            </span>
          </span>

          <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
            Your healthier blood sugar starts with{" "}
            <span className="text-gradient">one message.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/65">
            Join thousands who turned anxious guessing into calm, confident control —
            right inside the app they already love.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-8 py-4 text-lg"
            >
              <WhatsAppIcon className="h-6 w-6" />
              Chat with Dr Saab AI now
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink/60">
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" /> Free to start
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" /> No download
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-accent" /> Cancel anytime
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
