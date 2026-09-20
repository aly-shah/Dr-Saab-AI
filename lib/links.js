// Where the website's "Chat with DrSaab" buttons go.
//
// The bot's live WhatsApp number. NEXT_PUBLIC_WHATSAPP_NUMBER overrides it
// (digits with country code, e.g. 923001234567) for a staging number; either way
// the value is baked in at build time, so rebuild the site after changing it.

export const WEB_BOT_URL = "/bot";

// +92 322 8627171
const DEFAULT_WHATSAPP_NUMBER = "923228627171";

export const WHATSAPP_NUMBER = String(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");

// Pre-filled "Hi" so a new user lands straight in the bot's welcome flow.
export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi")}`
  : WEB_BOT_URL;

// Props for an <a> pointing at WhatsApp: a new tab for wa.me, same tab for
// the web-bot fallback.
export const whatsappLinkProps = WHATSAPP_NUMBER
  ? { href: WHATSAPP_URL, target: "_blank", rel: "noopener noreferrer" }
  : { href: WEB_BOT_URL };
