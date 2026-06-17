"use client";

import { useState } from "react";
import { PlusIcon, SparkleIcon } from "./icons";

const FAQS = [
  {
    q: "Is DrSaab a replacement for my doctor?",
    a: "No — and it will never pretend to be. DrSaab is an educational and coaching companion that helps you manage daily habits and understand your numbers. It always encourages you to follow your doctor's plan and to seek professional care for anything urgent.",
  },
  {
    q: "How do I start? Do I need to download anything?",
    a: "Nothing to download. Tap any 'Chat on WhatsApp' button and it opens a conversation with DrSaab in the WhatsApp app you already have. Say hello and you're in.",
  },
  {
    q: "Is my health data private and secure?",
    a: "Your chats are protected by WhatsApp's end-to-end encryption. We only use your information to personalise your coaching, never to sell to advertisers, and you can request deletion at any time.",
  },
  {
    q: "Can it help prevent diabetes, not just manage it?",
    a: "Yes. If you're pre-diabetic or at risk, DrSaab focuses on prevention — building sustainable habits around food, movement and sleep that are shown to lower your risk of developing type 2 diabetes.",
  },
  {
    q: "Which languages does it speak?",
    a: "DrSaab understands and replies in many major languages, including English, Arabic, Urdu, Hindi and Spanish, so guidance feels natural and familiar to you.",
  },
  {
    q: "What does it cost?",
    a: "Yes. DrSaab's core diabetes coaching is free forever. Premium plans are available for people who want deeper insights, advanced coaching, health report analysis, and additional accountability.",
  },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="reveal card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[16px] font-semibold text-ink">{q}</span>
        <span
          className={`grid h-8 w-8 flex-none place-items-center rounded-full bg-muted text-primary transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          <PlusIcon className="h-4 w-4" />
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink/65">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            Questions, answered
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Everything you might be wondering
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4">
          {FAQS.map((f) => (
            <Item key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
