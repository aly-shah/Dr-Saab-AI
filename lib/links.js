// Where the website's "Chat with DrSaab" buttons go.
//
// NEXT_PUBLIC_WHATSAPP_NUMBER is the bot's WhatsApp number, digits with
// country code (e.g. 923001234567). It is baked in at build time, so rebuild
// the site after changing it. Until it is set, every WhatsApp button falls
// back to the web bot so no button is ever dead.

export const WEB_BOT_URL = "/bot";

export const WHATSAPP_NUMBER = String(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

// Pre-filled "Hi" so a new user lands straight in the bot's welcome flow.
export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi")}`
  : WEB_BOT_URL;

// Props for an <a> pointing at WhatsApp: a new tab for wa.me, same tab for
// the web-bot fallback.
export const whatsappLinkProps = WHATSAPP_NUMBER
  ? { href: WHATSAPP_URL, target: "_blank", rel: "noopener noreferrer" }
  : { href: WEB_BOT_URL };
