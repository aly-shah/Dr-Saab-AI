# Dr Saab AI — Landing Page

A soft, trustworthy, health-focused landing page for **Dr Saab AI**, a diabetes
prevention & management chatbot that lives inside **WhatsApp**.

Built with **Next.js 15 (App Router)** + **Tailwind CSS**.

## Design system

Generated via the UI/UX design intelligence skill for a healthcare/wellness product:

- **Style:** Accessible & Ethical (WCAG-minded, calm, minimalist)
- **Colors:** Calm cyan `#0891B2` + health green `#059669` on an airy `#ECFEFF` background
- **Type:** `Lora` (headings) + `Raleway` (body)
- **Motion:** gentle float + scroll reveals, fully `prefers-reduced-motion` aware

## Sections

Nav → Hero (with live WhatsApp chat mockup) → Trust/stats → How it works →
Features (alternating blocks + glucose trend chart) → Why WhatsApp → Testimonials →
Pricing → FAQ → Final CTA → Footer (with medical disclaimer).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build for production

```bash
npm run build
npm start
```

## Deploy

Deploys to **Vercel** with zero config — push the repo and import it, or run `vercel`.

## Notes

- The "Chat on WhatsApp" buttons point to a placeholder `wa.me/10000000000` link.
  Replace it with your real WhatsApp Business number in the components
  (search the repo for `wa.me`).
- Photography is loaded from Unsplash's CDN. Swap the URLs in
  `components/Features.jsx` and `components/Testimonials.jsx` for your own assets.
- Dr Saab AI is **not** a medical device — see the disclaimer in the footer.
