import { HeartPulseIcon, WhatsAppIcon } from "./icons";

const COLS = [
  {
    title: "Product",
    links: ["How it works", "Features", "Pricing", "Results"],
  },
  {
    title: "Company",
    links: ["About", "Our medical approach", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy policy", "Terms of service", "Medical disclaimer", "Data deletion"],
  },
];

const WHATSAPP_URL = "/bot";

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-cloud/70">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#top" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-soft">
                <HeartPulseIcon className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-ink">
                Dr Saab <span className="text-primary">AI</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              A friendly, doctor-informed diabetes coach that lives inside WhatsApp —
              helping you prevent, manage and understand your blood sugar, one message
              at a time.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 px-5 py-2.5 text-sm"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-ink/80">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-ink/60 transition-colors hover:text-primary"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-amber-50 p-5 text-[13px] leading-relaxed text-amber-900/80 ring-1 ring-amber-200/70">
          <strong className="font-semibold">Medical disclaimer:</strong> Dr Saab AI
          provides general educational information and lifestyle coaching. It is not a
          medical device and does not diagnose, treat or replace professional medical
          advice. Always consult a qualified healthcare provider before changing your
          diet, medication or treatment. In an emergency, contact your local emergency
          services immediately.
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-8 text-sm text-ink/50 sm:flex-row">
          <p>© 2026 Dr Saab AI. Made with care for healthier lives.</p>
          <p className="text-ink/40">Not affiliated with or endorsed by WhatsApp / Meta.</p>
        </div>
      </div>
    </footer>
  );
}
