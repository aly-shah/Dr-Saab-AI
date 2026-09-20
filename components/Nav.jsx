"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon, MenuIcon, CloseIcon } from "./icons";
import { whatsappLinkProps, WEB_BOT_URL } from "@/lib/links";

const LINKS = [
  { href: "#how", label: "How DrSaab Works" },
  { href: "#features", label: "Features" },
  { href: "#results", label: "About DrSaab" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line/60 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-page flex h-[68px] items-center justify-between" aria-label="Main">
        <a href="#top" className="flex items-center" aria-label="DrSaab home">
          <img src="/logo.png" alt="DrSaab" className="h-10 w-auto" />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-ink/70 transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden flex-col items-center gap-1 lg:flex">
          <a {...whatsappLinkProps} className="btn-primary px-5 py-2.5 text-sm">
            <WhatsAppIcon className="h-4 w-4" />
            Chat with DrSaab
          </a>
          <a href={WEB_BOT_URL} className="text-[11px] font-medium text-ink/55 underline-offset-2 hover:text-primary hover:underline">
            Use the Web Bot instead
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink ring-1 ring-line lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line/60 bg-white/95 backdrop-blur-md lg:hidden">
          <ul className="container-page flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-ink/80 hover:bg-muted hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                {...whatsappLinkProps}
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Chat with DrSaab
              </a>
              <a
                href={WEB_BOT_URL}
                onClick={() => setOpen(false)}
                className="mt-2 block text-center text-sm font-medium text-ink/60 hover:text-primary hover:underline"
              >
                Use the Web Bot instead
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
