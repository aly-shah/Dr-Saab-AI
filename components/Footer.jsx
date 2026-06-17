import { WhatsAppIcon } from "./icons";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "How DrSaab Works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About DrSaab", href: "#results" },
      // "Our approach" PDF opens in a new tab — drop the file at /public/our-approach.pdf
      { label: "Our approach", href: "/our-approach.pdf", target: "_blank" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    // Trust Center — legal docs go here once the client adds the files to /public.
    title: "Trust Center",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Medical disclaimer", href: "#" },
      { label: "Data deletion", href: "#" },
    ],
  },
];

const WHATSAPP_URL = "/bot";

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-cloud/70">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#top" className="flex items-center">
              <img src="/logo.png" alt="DrSaab" className="h-11 w-auto" />
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
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.target ? { target: l.target, rel: "noopener noreferrer" } : {})}
                      className="text-sm text-ink/60 transition-colors hover:text-primary"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-amber-50 p-5 text-[13px] leading-relaxed text-amber-900/80 ring-1 ring-amber-200/70">
          <strong className="font-semibold">Medical disclaimer:</strong> DrSaab
          provides general educational information and lifestyle coaching. It is not a
          medical device and does not diagnose, treat or replace professional medical
          advice. Always consult a qualified healthcare provider before changing your
          diet, medication or treatment. In an emergency, contact your local emergency
          services immediately.
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-8 text-sm text-ink/50 sm:flex-row">
          <p>© 2026 DrSaab. Made with care for healthier lives.</p>
          <p className="text-ink/40">Not affiliated with or endorsed by WhatsApp / Meta.</p>
        </div>
      </div>
    </footer>
  );
}
