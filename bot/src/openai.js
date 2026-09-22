import OpenAI from "openai";
import https from "node:https";
import nodeFetch from "node-fetch";
import { config } from "./config.js";
import { logError, logWarn, logOk } from "./log.js";
import { describeLlmError } from "./errors.js";

// Node's built-in fetch (undici) intermittently — and on some VPS networks
// consistently — aborts Groq responses mid-body as "Premature close" (Groq
// sits behind Cloudflare, and undici's pooled/keep-alive handling of that
// connection is the trigger). Routing the OpenAI SDK through node-fetch on
// Node's core HTTPS stack, with keep-alive OFF so every call gets a fresh
// connection, avoids the failing code path entirely.
const keepAliveOffAgent = new https.Agent({ keepAlive: false });
const resilientFetch = (url, init = {}) => nodeFetch(url, { agent: keepAliveOffAgent, ...init });

// OpenAI-compatible client. Points at Groq when GROQ_API_KEY is set.
// maxRetries + timeout add a second layer of resilience on top of the
// fresh-connection fetch above.
const client = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
  maxRetries: 4,
  timeout: 60_000,
  fetch: resilientFetch,
});

// OpenAI is the PRIMARY provider for every AI call (chat replies, photo
// analysis, lab reports, report generation). Groq (`client`) is kept only as
// a backup for when OpenAI fails. Only exists when both a Groq key and an
// OpenAI key are configured — otherwise everything uses `client`.
// One retry only: with Groq as backup, more SDK retries (with backoff) just
// keep the user waiting ~10s when OpenAI is down or out of credits.
const paidClient = config.llm.paidApiKey
  ? new OpenAI({ apiKey: config.llm.paidApiKey, maxRetries: 1, timeout: 60_000, fetch: resilientFetch })
  : null;

// Transient mid-response socket drops surface differently across HTTP stacks:
// undici uses "Premature close" / UND_ERR_SOCKET; node-fetch (core https) uses
// ECONNRESET / "aborted" / FetchError. The OpenAI SDK's built-in retry does not
// reliably cover these, so we wrap the call ourselves and retry on any of them.
function isPrematureClose(e) {
  const msg = e?.message || e?.cause?.message || "";
  const code = String(e?.code || e?.cause?.code || e?.errno || "");
  return (
    /Premature close|socket hang up|aborted|terminated|network|fetch failed|ECONNRESET|ETIMEDOUT|EPIPE|UND_ERR/i.test(msg) ||
    /ECONNRESET|ETIMEDOUT|EPIPE|UND_ERR/i.test(code)
  );
}

const LANG_NAME = {
  en: "English",
  ur: "Urdu (اردو script)",
  roman_ur: "Roman Urdu (Urdu written in Latin/English letters)",
};

function languageInstruction(lang) {
  return `Always reply in ${LANG_NAME[lang] || "English"}. Keep it natural and warm.`;
}

const SAFETY = `
You are "DrSaab", a friendly, encouraging diabetes self-management coach on a chat app.

SCOPE — you ONLY help with: diabetes & blood sugar, nutrition/diet as it affects health, physical activity, medication adherence (not prescribing), sleep/stress as they affect metabolic health, lab results, and the user's own health data and goals.
- If the user asks about anything OUTSIDE this scope (e.g. general cooking recipes, dessert/cake recipes, coding, news, celebrities, homework, math, jokes, politics, other illnesses unrelated to diabetes), DO NOT answer it. Politely decline in one short sentence and steer them back to their diabetes/health journey. Example: "I'm your diabetes coach, so I'll stick to your health — but I can suggest a blood-sugar-friendly snack if you'd like. 🙂"
- Food questions are only in scope when framed around health/blood-sugar impact, not as plain recipes.

Hard rules:
- You are NOT a doctor and do NOT diagnose or prescribe. You give general education, lifestyle guidance, and motivation.
- For red-flag symptoms (very high/low sugar, chest pain, fainting, confusion, vomiting, vision loss, pregnancy concerns), tell the user to contact a doctor or emergency services immediately.
- Never tell a user to change or stop prescribed medication; tell them to consult their doctor.
- Be concise and practical for a chat: short paragraphs, simple words, a warm but professional tone. Avoid long essays.
- Do NOT use emojis or decorative symbols. Keep replies clean, plain, and professional.
`;

function profileContext(user) {
  const parts = [];
  if (user?.name) parts.push(`Name: ${user.name}`);
  if (user?.age) parts.push(`Age: ${user.age}`);
  if (user?.gender) parts.push(`Gender: ${user.gender}`);
  if (user?.diabetes_status) parts.push(`Diabetes status: ${user.diabetes_status}`);
  // From My Health — the canonical health profile the coach should reference
  // without asking the user to repeat it.
  if (user?.other_conditions) parts.push(`Conditions: ${user.other_conditions}`);
  if (user?.latest_hba1c) parts.push(`Latest HbA1c: ${user.latest_hba1c}%`);
  if (user?.height_cm) parts.push(`Height: ${user.height_cm} cm`);
  if (user?.weight_kg) parts.push(`Weight: ${user.weight_kg} kg`);
  if (user?.goals) parts.push(`Goals: ${user.goals}`);
  if (user?.medications) parts.push(`Medications: ${user.medications}`);
  if (user?.city) parts.push(`City: ${user.city} (consider locally common foods)`);
  return parts.length ? `User profile:\n${parts.join("\n")}` : "No profile details yet.";
}

// Ask DrSaab persona — a warmer, broader voice than the domain-specific
// coaches. Combines diabetes coach / diabetologist-educator / fitness trainer
// / psychologist / patient educator into one friendly voice, per spec.
const ASK_DRSAAB_PERSONA = `
You are DrSaab, a warm, encouraging health coach on WhatsApp. You blend the perspectives of a diabetes coach, a diabetologist (educator, not prescriber), a fitness trainer, a psychologist and a patient educator into one friendly voice.

Personality: friendly, encouraging, calm, patient, respectful, practical, motivating, honest, professional. Supportive without being overly emotional — think "kind coach with high standards": celebrate progress, encourage consistency, be direct when necessary, and never shame or guilt the user.

Style:
- Short, WhatsApp-length replies. Simple language, no unnecessary medical jargon.
- Give practical next steps. Ask a follow-up question only when it's actually needed.
- Do NOT use emojis or decorative symbols.
- Use the user's stored health data ONLY when it makes the answer more useful. Do not restate profile information for its own sake, and do not repeat their personal details in every reply.

Additional hard rules for Ask DrSaab:
- Never present uncertain information as fact. If unsure, say so.
- For potentially serious symptoms or emergencies, tell the user to seek immediate medical attention or contact their local emergency services.
- Politely refuse medical misinformation, dangerous advice, illegal requests, hate speech, harassment, sexually explicit content, self-harm assistance, or violence.
- If the user is abusive, stay polite and calm, do not argue, and continue helping if possible.
- Always prioritize patient safety over completeness of the answer.
`;

const KIND_ROLE = {
  coach:
    "Focus on overall diabetes self-management: blood sugar patterns, habits, motivation, accountability and consistency.",
  food:
    "You are the FOOD COACH. Assume the user is in Pakistan unless they say otherwise, so interpret meal and restaurant names in Pakistani/desi context. When given a meal (text or photo), estimate carbohydrate load and glycemic impact, flag concerns, and suggest healthier swaps using foods that are actually available at that place — Pakistani/desi cuisine (biryani, karahi, kebabs, tikka, naan, roti, daal, sabzi, chapli kebab, nihari, haleem, chaat, seekh, chicken tikka, mutton karahi, sajji), not American fast-food defaults. In particular, 'BBQ' in a Pakistani restaurant name (e.g. BBQ Tonight) refers to charcoal-grilled kebabs/tikka/karahi — NOT hot dogs, burgers, ribs or American barbecue. Only assume international/American menu items if the user names a US chain (McDonald's, KFC, Hardee's, Subway, Domino's, Pizza Hut, Burger King). If the user names a specific restaurant, ground your advice in that restaurant's actual menu categories; do not invent items that are not typically served there. Be specific and practical, WhatsApp-length.",
  analyze:
    "You are the MEAL ANALYSER. The user will describe a meal (text) or send a photo of a plate. Estimate the meal for one typical serving and reply in this EXACT structure, no preamble:\n\n*Meal:* (one-line description of what you see)\n*Per serving (estimate):*\n• Calories: …\n• Carbohydrates: …\n• Protein: …\n• Fat: …\n• Fibre: … (skip this line if you cannot tell)\n\n*Blood sugar impact:* 🟢 Low / 🟡 Moderate / 🔴 High — then explain in ONE line why.\n*Portion advice:* one line.\n*Suggested improvements:* 1–3 concise bullets.\n*Well done:* one short line of positive reinforcement — only when the meal is a genuinely good choice.\n\nNever present estimates as exact nutrition facts. Use foods common to the user's region. Keep it WhatsApp-length. End with: ✅ Meal analysed.",
  label:
    "You are the NUTRITION LABEL ANALYST. The user will send a photo of a Nutrition Facts label or ingredients list on a packaged food. Extract: calories, carbohydrates, added sugars (if listed), fibre, protein, and serving size. Ignore marketing claims like 'Sugar Free', 'Low Fat' or 'Healthy' — rely only on the panel and ingredients.\n\nFRIENDLY OPENING (overrides the general no-emoji rule): The VERY FIRST character of your reply MUST be one of these three emoticons, chosen to match the overall verdict:\n  • 😀 → Good Choice (healthy for someone with diabetes)\n  • 😬 → Okay Occasionally (borderline; small portions only)\n  • 😞 → Best to Limit (high sugar / refined carbs / poor choice)\nFollow the emoticon with a single warm sentence in the same line, then a blank line, then the structured breakdown below. Do NOT use any other emoji anywhere else in the reply except the coloured circles in the Rating line.\n\nReply in this exact structure:\n\n<one of 😀 / 😬 / 😞> <one friendly sentence about this product>\n\n• *Product:* (name if visible)\n• *Serving:* (size)\n• *Per serving:* Calories … | Carbs … | Added sugar … | Fibre … | Protein …\n\n*Rating:* choose one of 🟢 Good Choice / 🟡 Okay Occasionally / 🔴 Best to Limit — then explain in ONE line why. The colour MUST match the opening emoticon (😀↔🟢, 😬↔🟡, 😞↔🔴).\n*Suggested serving:* one line.\n*Healthier alternative:* one line (skip if unnecessary).\n\nKeep language simple, non-technical, WhatsApp-length. End with: ✅ Nutrition label analysed.",
  fitness:
    "You are the FITNESS COACH. Suggest safe, realistic movement for someone with the user's profile (e.g. short post-meal walks, light strength work). Respect any limitations and keep goals achievable.",
};

// Groq accepts a much smaller image when it's inlined as base64 than when it's
// fetched from a URL (the documented 20 MB request ceiling is the URL case),
// and it rejects an oversized one with a bare HTTP 400 — indistinguishable from
// a real misconfiguration, so the user used to get "something is off on our
// side" for nothing worse than a big photo. Check it ourselves and raise a 413
// instead, which every caller already maps to the "that file is too large"
// message via errorKey().
const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;

function oversizedImageBytes(messages) {
  for (const m of messages) {
    if (!Array.isArray(m?.content)) continue;
    for (const part of m.content) {
      const url = part?.image_url?.url;
      if (typeof url === "string" && url.length > MAX_INLINE_IMAGE_BYTES) return url.length;
    }
  }
  return 0;
}

// Phone photos arrive at full resolution, and OpenAI bills images by pixel
// area. Downscale to fit imageMaxPx (a meal photo reads fine at 1024px; lab
// reports pass a larger size so small print stays legible). sharp is loaded
// lazily — if it's missing, images go through unchanged.
let sharpLib;
async function loadSharp() {
  if (sharpLib === undefined) {
    sharpLib = await import("sharp").then((m) => m.default).catch(() => null);
  }
  return sharpLib;
}

export async function shrinkImages(messages, maxPx) {
  if (!hasImage(messages)) return messages;
  const sharp = await loadSharp();
  if (!sharp) return messages;
  const shrink = async (url) => {
    const m = /^data:image\/[a-z+]+;base64,(.+)$/i.exec(url);
    if (!m) return url;
    try {
      const buf = Buffer.from(m[1], "base64");
      const out = await sharp(buf)
        .rotate()
        .resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      return out.length < buf.length ? `data:image/jpeg;base64,${out.toString("base64")}` : url;
    } catch {
      return url;
    }
  };
  return Promise.all(
    messages.map(async (msg) => {
      if (!Array.isArray(msg?.content)) return msg;
      const content = await Promise.all(
        msg.content.map(async (p) =>
          p?.image_url?.url ? { ...p, image_url: { ...p.image_url, url: await shrink(p.image_url.url) } } : p,
        ),
      );
      return { ...msg, content };
    }),
  );
}

function hasImage(messages) {
  return messages.some((m) => Array.isArray(m?.content) && m.content.some((p) => p?.image_url));
}

// `backup: true` is internal — the retry on Groq after OpenAI has failed.
// Callers' `model` names a Groq model; OpenAI calls use LLM_PAID_MODEL /
// LLM_PAID_VISION_MODEL instead.
async function complete(messages, { maxTokens = 600, model, jsonMode = false, reasoningEffort = null, backup = false, imageMaxPx = 1024, cheap = false } = {}) {
  if (!backup) messages = await shrinkImages(messages, imageMaxPx);
  const tooBig = oversizedImageBytes(messages);
  if (tooBig) {
    const e = new Error(
      `image too large to send inline: ${Math.round(tooBig / 1024 / 1024)} MB base64 ` +
        `(limit ${MAX_INLINE_IMAGE_BYTES / 1024 / 1024} MB)`,
    );
    e.status = 413;
    logError(`${config.llm.provider.toUpperCase()} LLM`, e.message);
    throw e;
  }
  const useOpenAI = !!paidClient && !backup;
  const chosenClient = useOpenAI ? paidClient : client;
  const usedModel = useOpenAI
    ? hasImage(messages)
      ? config.llm.paidVisionModel
      : cheap
        ? config.llm.paidExtractModel || config.llm.paidModel
        : config.llm.paidModel
    : model || config.llm.model;
  try {
    const req = {
      model: usedModel,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    };
    if (jsonMode) req.response_format = { type: "json_object" };
    // Qwen models on Groq emit <think>…</think> reasoning traces by default,
    // which break the meal-analyser's strict output format. Turn them off.
    if (/qwen/i.test(usedModel)) req.reasoning_effort = "none";
    // gpt-oss on Groq is a reasoning model: its hidden reasoning is billed
    // against max_tokens, and a data-heavy prompt can burn the whole budget
    // before any visible output ("finish_reason: length", empty content, or a
    // JSON-mode 400). Callers that send such prompts ask for a lower effort.
    if (reasoningEffort && /gpt-oss/i.test(usedModel)) req.reasoning_effort = reasoningEffort;
    // Stream the completion instead of buffering the whole body. On some VPS
    // networks a large buffered response over a reused keep-alive socket drops
    // mid-body as "Premature close"; consuming the body incrementally as chunks
    // arrive avoids that failure mode. We still retry the whole read on a
    // mid-stream drop. The public contract is unchanged: we return the full text.
    let content = "";
    for (let attempt = 0; ; attempt++) {
      try {
        content = "";
        const stream = await chosenClient.chat.completions.create({ ...req, stream: true });
        for await (const chunk of stream) {
          content += chunk.choices?.[0]?.delta?.content || "";
        }
        break;
      } catch (err) {
        if (attempt < 3 && isPrematureClose(err)) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        // Groq refuses long/complex JSON with "Failed to generate JSON …" / "Failed to
        // validate JSON …" (typically
        // when max_tokens truncates the object mid-string). parseLabJson() and the
        // KB extractor both tolerate prose-wrapped JSON, so drop the strict
        // response_format constraint and retry once — better a good text answer
        // than a hard failure for the user.
        if (req.response_format && /failed to (generate|validate) json/i.test(err?.message || "")) {
          delete req.response_format;
          continue;
        }
        throw err;
      }
    }
    return content.trim();
  } catch (e) {
    // Explain the real cause in red (e.g. "GROQ rate limit hit (429)…") so it's
    // obvious in the logs why a reply failed. Flows still show the user a
    // friendly message and continue.
    // Tag rate-limit / quota errors (HTTP 429) so callers can tell the user
    // "AI is busy, try again shortly" instead of a generic failure — or silence.
    const status = e?.status ?? e?.response?.status;
    if (status === 429) e.aiLimited = true;
    // Distinguish "credits/quota actually exhausted" from a short-lived rate
    // spike. Providers signal exhaustion via specific keywords in the message
    // body (or via HTTP 402). Callers use this flag to show a different
    // message to the user (top-up / contact admin) instead of "try again in
    // a minute", which is misleading when there is nothing to wait for.
    const apiMsg =
      e?.error?.message || e?.response?.data?.error?.message || e?.message || "";
    if (
      status === 402 ||
      (status === 429 && /quota|insufficient|credit|billing|exceeded your current|out of credits|no credits/i.test(apiMsg))
    ) {
      e.aiCreditsExhausted = true;
      e.aiLimited = true;
    }
    if (useOpenAI) {
      logError("OPENAI LLM", describeLlmError(e, "OpenAI", usedModel));
      // Whatever went wrong on OpenAI (credits, key, outage, timeout), answer
      // from the Groq backup instead of failing the user.
      logError("OPENAI LLM", `answering from the ${config.llm.provider.toUpperCase()} backup instead.`);
      return complete(messages, { maxTokens, model, jsonMode, reasoningEffort, backup: true });
    }
    logError(`${config.llm.provider.toUpperCase()} LLM`, describeLlmError(e, config.llm.provider, usedModel));
    throw e;
  }
}

// Boot-time sanity check on the configured models.
//
// Providers retire models. When that happens every call returns 404
// model_not_found, which reaches the patient as "something is off on our side"
// and looks like an outage — the failure gives no hint that a name in .env has
// simply gone stale. One catalog lookup at startup turns that into an obvious
// red line in the log the moment the bot restarts.
//
// Never throws: a provider whose catalog endpoint is unreachable or shaped
// differently must not stop the bot from booting.
// Only the small, cheap tiers belong in a chat bot. Anything else (flagship
// or reasoning models) gets a loud warning at boot.
const SMALL_MODEL_RE = /(mini|nano|small|flash|lite|haiku|8b|7b|20b)/i;

// Groq models verified to read images, newest first (checked 2026-09-22).
const GROQ_VISION_MODELS = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "meta-llama/llama-4-scout-17b-16e-instruct"];

export async function verifyModels() {
  try {
    const list = await client.models.list();
    const ids = new Set((list?.data || []).map((m) => m.id));
    if (!ids.size) return;
    // Photos on the Groq backup need a vision model. When the configured one
    // was retired (qwen/qwen3.6-27b, 2026-09) or is text-only (gpt-oss
    // rejects image content with a 400), switch to one the catalog still has
    // instead of failing every photo / lab report with a 404.
    if (config.llm.provider === "groq" && (!ids.has(config.llm.visionModel) || /gpt-oss/i.test(config.llm.visionModel))) {
      const pick = GROQ_VISION_MODELS.find((m) => ids.has(m));
      if (pick) {
        logError(
          "LLM model check",
          `LLM_VISION_MODEL="${config.llm.visionModel}" can't read photos on Groq — using "${pick}" instead. ` +
            `Update LLM_VISION_MODEL in bot/.env to silence this.`,
        );
        config.llm.visionModel = pick;
      }
    }
    const configured = [
      ["LLM_MODEL", config.llm.model],
      ["LLM_VISION_MODEL", config.llm.visionModel],
    ];
    let ok = true;
    for (const [envName, model] of configured) {
      if (model && !ids.has(model)) {
        ok = false;
        logError(
          "LLM model check",
          `${envName}="${model}" is NOT in the ${config.llm.provider} catalog — every call using it will fail with 404. ` +
            `Set ${envName} in bot/.env to one of: ${[...ids].slice(0, 12).join(", ")}`,
        );
      }
    }
    if (ok) logOk(`LLM models verified: ${config.llm.model} (text) · ${config.llm.visionModel} (vision)`);
    if (paidClient) {
      const oa = new Set(((await paidClient.models.list())?.data || []).map((m) => m.id));
      for (const [envName, m] of [
        ["LLM_PAID_MODEL", config.llm.paidModel],
        ["LLM_PAID_VISION_MODEL", config.llm.paidVisionModel],
        ["LLM_PAID_EXTRACT_MODEL", config.llm.paidExtractModel],
      ]) {
        if (oa.size && m && !oa.has(m))
          logError("LLM model check", `${envName}="${m}" is NOT in the OpenAI catalog — every OpenAI call will fall back to Groq.`);
        // Guard against an expensive model being configured by accident: the
        // mini/nano tier costs a small fraction of the flagship and reasoning
        // models, and a chat bot has no use for the difference.
        if (m && !SMALL_MODEL_RE.test(m))
          logWarn(
            "LLM cost check",
            `${envName}="${m}" is not a mini/nano model — expect a much higher bill. Use e.g. gpt-4o-mini, gpt-4.1-mini or gpt-4.1-nano.`,
          );
      }
      logOk(
        `OpenAI primary: ${config.llm.paidModel} (text) · ${config.llm.paidVisionModel} (vision) · ` +
          `${config.llm.paidExtractModel} (extraction) — ${config.llm.provider} is backup`,
      );
    }
  } catch (e) {
    logWarn("LLM model check", `could not read the model catalog: ${e?.message || e}`);
  }
}

// Chat history is the biggest input cost: every earlier reply is re-sent on
// each turn. Keep the last 3 exchanges and clip long earlier replies — the
// model only needs the gist to stay on topic.
const HISTORY_MESSAGES = 6;
const HISTORY_CHARS = 600;
export function trimHistory(history) {
  return (history || []).slice(-HISTORY_MESSAGES).map((m) => {
    const c = typeof m.content === "string" ? m.content : "";
    return { role: m.role, content: c.length > HISTORY_CHARS ? c.slice(0, HISTORY_CHARS) + "…" : c };
  });
}

function userContent(text, imageDataUrl) {
  if (!imageDataUrl) return text || "";
  const content = [];
  if (text) content.push({ type: "text", text });
  content.push({ type: "image_url", image_url: { url: imageDataUrl } });
  return content;
}

/**
 * Conversational coach reply.
 * @param {object} user  user row
 * @param {Array}  history  [{role, content}] prior turns (text only)
 * @param {string} text  latest user text
 * @param {string} kind  'coach' | 'food' | 'fitness'
 * @param {string} [imageDataUrl] optional data URI for vision
 */
export async function coachReply(user, history, text, kind = "coach", imageDataUrl = null, extraContext = "") {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    KIND_ROLE[kind] || KIND_ROLE.coach,
    profileContext(user),
    extraContext, // compact, token-cheap recent-data line
    languageInstruction(lang),
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    { role: "system", content: system },
    ...trimHistory(history),
    { role: "user", content: userContent(text, imageDataUrl) },
  ];
  // Structured meal / label replies fit well inside 450 tokens; the prompts
  // already ask for WhatsApp-length answers.
  return complete(messages, {
    maxTokens: 450,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
  });
}

/**
 * Ask DrSaab open-ended reply. Same conversational shape as `coachReply` but
 * with the broader DrSaab persona and richer personalization.
 *
 * @param {object} user           user row
 * @param {Array}  history        [{role, content}] prior turns (text only)
 * @param {string} text           latest user text
 * @param {object} [opts]
 * @param {string} [opts.imageDataUrl] optional data URI for vision
 * @param {string} [opts.personalCtx]  compact personalisation block
 * @param {boolean}[opts.paid]         true → longer reply budget for paid users
 */
export async function askDrsaabReply(user, history, text, opts = {}) {
  const { imageDataUrl = null, personalCtx = "", paid = false } = opts;
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    ASK_DRSAAB_PERSONA,
    profileContext(user),
    personalCtx,
    languageInstruction(lang),
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    { role: "system", content: system },
    ...trimHistory(history),
    { role: "user", content: userContent(text, imageDataUrl) },
  ];

  // Photos use the vision model (OpenAI's LLM_PAID_VISION_MODEL, or Groq's on backup).
  if (imageDataUrl) {
    return complete(messages, { maxTokens: 450, model: config.llm.visionModel });
  }
  return complete(messages, { maxTokens: paid ? 600 : 400 });
}

/**
 * Lab report analyser. Extracts structured data AND generates a plain-language
 * explanation in one JSON call. Returns:
 *   { analysis, metadata, values, labSource }
 *
 * `analysis` is the markdown shown to the user. The other three are stored
 * silently for history/trends/market intel — see labreport.js.
 *
 * When `priorValues` are provided (compact string of prior test → result rows)
 * the model is asked to comment on trends vs. the last report.
 */
export async function explainLab(user, text, imageDataUrl = null, priorValues = "") {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    `You are a LAB REPORT ANALYST for a diabetes coaching app. The user gave you a report (image and/or pasted text). Return ONE JSON object — no prose outside the JSON — with these fields:

{
  "unreadable": boolean,
  "partial_unreadable": boolean,
  "unreadable_reason": string|null,
  "metadata": {
    "lab_name": string|null,
    "lab_branch": string|null,
    "lab_address": string|null,
    "report_date": string|null,
    "patient_name": string|null,
    "patient_age": string|null,
    "patient_gender": string|null,
    "report_type": string|null,
    "doctor_name": string|null
  },
  "values": [
    { "test": string, "result": string, "unit": string|null, "reference_range": string|null,
      "status": "in_range" | "borderline" | "out_of_range" | "unknown" }
  ],
  "lab_source": {
    "lab_name": string|null, "lab_branch": string|null, "lab_address": string|null,
    "report_format": string|null
  },
  "analysis": string
}

Rules for extraction:
- IMPORTANT (fully unreadable): Set "unreadable": true ONLY if the ENTIRE image is unreadable — you cannot make out any test values at all. In that case leave metadata/values empty and set "analysis" to an empty string. Also set "unreadable": true if the image is clearly not a medical/lab report (e.g. a random photo, selfie, food, unrelated screenshot).
- IMPORTANT (partially unreadable): If you can read SOME of the report but a portion is blurred, cropped, glared, cut off, or otherwise not legible, set "unreadable": false AND "partial_unreadable": true. Extract every value you can read confidently, skip the ones you cannot, and put a SHORT plain-language description of what is missing into "unreadable_reason" (e.g. "the bottom rows of the CBC table are blurred" or "the reference-range column on the right is cut off"). Never guess or invent values for the unreadable part.
- If the whole image is clear, set both "unreadable" and "partial_unreadable" to false and leave "unreadable_reason" null.
- Prioritize these tests where present: HbA1c, fasting glucose, random glucose, LDL, HDL, total cholesterol, triglycerides, creatinine, eGFR, urea, ALT/SGPT, AST/SGOT, urine albumin, urine microalbumin, and any CBC values.
- If a single field is missing but the rest of the report is readable, leave that field null. Do not invent values.
- Status is judged against the printed reference range on the report; if no range is given, use general adult reference ranges and mark "unknown" if you're not sure.

Rules for the "analysis" field (markdown, user-facing):
- Language: reply in ${LANG_NAME[lang] || "English"}.
- Structure:
    1. A short intro line naming the report type and lab (if known).
    2. For each extracted value: a line beginning with a status dot (🟢 in range, 🟡 borderline, 🔴 outside range) then the test name and result, followed by one to two sentences explaining what the test measures, why it matters for diabetes, and a simple lifestyle suggestion where useful.
    3. A "*Overall Summary*" section with 3–5 short bullets (e.g. "HbA1c is improving.", "Cholesterol is within range.").
- If previous readings are provided below, compare the current value to the most recent prior value and note improvement or worsening in one short phrase.
- Never diagnose diseases. Never tell the user to start / stop / change any prescribed medication.
- Flag any significantly abnormal values by telling the user to contact their healthcare provider promptly.
- Do NOT include a legal disclaimer in the analysis — the app appends one separately.

Return valid JSON only.`,
    profileContext(user),
    priorValues ? `Previous readings for comparison (most recent first):\n${priorValues}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    { role: "system", content: system },
    {
      role: "user",
      content: userContent(
        text || "Please analyse the attached lab report.",
        imageDataUrl
      ),
    },
  ];
  const raw = await complete(messages, {
    // Large CBC/lipid panels can carry 15–20 values, each needing 1–2 sentences
    // in the analysis field. 1500 tokens truncated the JSON mid-string on real
    // CBC reports and dumped raw partial JSON to the user; 3000 gives headroom.
    maxTokens: 3000,
    // Lab reports carry small print — keep more pixels than a meal photo.
    imageMaxPx: 1600,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
    jsonMode: !imageDataUrl, // vision endpoints often reject response_format
  });

  const parsed = parseLabJson(raw);
  // Hard rule: users must never see raw JSON. If the parsed `analysis` field
  // is missing, try the truncated-JSON recovery; if that also fails, return
  // an empty analysis so the caller's empty-response guard shows a friendly
  // error rather than dumping `raw` (which is almost always JSON here).
  let analysis = parsed.analysis || extractAnalysisFallback(raw) || "";
  if (looksLikeJson(analysis)) analysis = "";
  const values = Array.isArray(parsed.values) ? parsed.values : null;
  const metadata = parsed.metadata || null;
  // Consider the image unreadable when the model explicitly flags it, OR when
  // we sent an image and got back nothing meaningful (no values and no
  // identifying metadata). The latter catches models that ignore the flag but
  // still refuse to invent data.
  const nothingExtracted =
    !values?.length &&
    !metadata?.lab_name &&
    !metadata?.patient_name &&
    !metadata?.report_type;
  const unreadable = !!parsed.unreadable || (!!imageDataUrl && nothingExtracted && !analysis);
  const partialUnreadable = !unreadable && !!parsed.partial_unreadable;
  const unreadableReason = typeof parsed.unreadable_reason === "string"
    ? parsed.unreadable_reason.trim()
    : "";
  return {
    analysis,
    metadata,
    values,
    labSource: parsed.lab_source || null,
    unreadable,
    partialUnreadable,
    unreadableReason,
  };
}

// True when the string is (or begins with) JSON-shaped content — an opening
// brace/bracket or a leading `"key":` pair. Used to make sure we never leak
// raw model JSON into the user-facing analysis message.
function looksLikeJson(s) {
  if (!s) return false;
  const trimmed = String(s).trim();
  if (!trimmed) return false;
  if (/^[{[]/.test(trimmed)) return true;
  if (/^"[a-zA-Z_][\w-]*"\s*:/.test(trimmed)) return true;
  return false;
}

// Best-effort JSON extractor. Handles clean JSON, fenced ```json blocks, and
// mixed prose where a { ... } object is embedded somewhere in the reply.
function parseLabJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through */
  }
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch { /* fall through */ }
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(raw.slice(first, last + 1)); } catch { /* fall through */ }
  }
  return {};
}

// Last-resort recovery when the model returned JSON but it got truncated
// mid-string (max_tokens hit). Pulls just the `"analysis": "..."` field body
// and unescapes it, so the user still sees prose instead of raw JSON.
function extractAnalysisFallback(raw) {
  if (!raw) return "";
  const m = raw.match(/"analysis"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|$)/);
  if (!m) return "";
  try {
    return JSON.parse('"' + m[1].replace(/(^|[^\\])"/g, '$1\\"') + '"');
  } catch {
    return m[1]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

/**
 * Executive Health Snapshot (paid "Generate Report") — the AI-written parts
 * of the PDF: two short trend summaries, a one-line health-score message and
 * three key insights. Like every call, goes to OpenAI first with Groq as backup. Always English — the PDF
 * is a shareable document with a fixed English design. Throws on failure so
 * the caller can fall back to fallbackInsights().
 *
 * @param {object} user  user row
 * @param {string} facts compact plain-text facts block (snapshotData.factsBlock)
 * @returns {{weekly_summary:string, monthly_summary:string, score_message:string, insights:Array<{tone:string,text:string}>}}
 */
// The same patient's report is often opened several times (patient taps
// Generate Report again, admin re-opens it in the panel). The narrative only
// depends on the facts block, so reuse it for 12h while the facts are
// unchanged — any new reading changes the facts and gets a fresh write-up.
const INSIGHTS_TTL_MS = 12 * 60 * 60 * 1000;
const insightsCache = new Map();

export async function snapshotInsights(user, facts) {
  const cacheKey = `${user?.id || ""}|${facts}`;
  const hit = insightsCache.get(cacheKey);
  if (hit && Date.now() - hit.at < INSIGHTS_TTL_MS) return hit.value;
  const value = await snapshotInsightsUncached(facts);
  insightsCache.set(cacheKey, { at: Date.now(), value });
  if (insightsCache.size > 300) insightsCache.delete(insightsCache.keys().next().value);
  return value;
}

async function snapshotInsightsUncached(facts) {
  const system = `You write the narrative parts of a one-page "Executive Health Snapshot" PDF for a person managing diabetes with the DrSaab coaching app. You are given the exact numbers the page shows. Return ONE JSON object only:

{ "weekly_summary": string, "monthly_summary": string, "score_message": string, "insights": [ { "tone": string, "text": string } ] }

Field rules:
- weekly_summary: 2 sentences, max 45 words, about the last 14 days of fasting and random readings.
- monthly_summary: 2 sentences, max 45 words, about the last 90 days.
- score_message: 1-2 sentences, max 28 words, a warm reaction to the health score and how to keep improving.
- insights: exactly 3 items, most important first; tone is one of "good", "warn", "info"; each text max 24 words.

Rules:
- Plain, warm, professional English. No emojis, no markdown, no bullet characters, no exclamation marks in more than one place.
- Use ONLY the numbers provided. Never invent values, dates or lab results. Units are mg/dL for glucose and % for HbA1c.
- If a section says there is not enough data, say that gently and tell the person what to log (fasting and random readings) so the trend can be shown next time.
- "good" = something in target worth keeping up; "warn" = a pattern to watch with ONE practical lifestyle suggestion (post-meal walk, earlier dinner, portion, sleep, hydration); "info" = a logging/next-step tip.
- Never diagnose, never tell the user to start, stop or change any medicine — say "discuss with your doctor" where relevant.
- Return valid JSON only.`;
  const raw = await complete(
    [
      { role: "system", content: system },
      { role: "user", content: facts },
    ],
    // The facts block is dense; give the model room to think AND answer.
    { maxTokens: 2000, jsonMode: true, reasoningEffort: "low" }
  );
  const out = parseLabJson(raw) || {};
  const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
  const insights = (Array.isArray(out.insights) ? out.insights : [])
    .filter((i) => i && i.text)
    .map((i) => ({
      tone: ["good", "warn", "info"].includes(String(i.tone).toLowerCase()) ? String(i.tone).toLowerCase() : "info",
      text: clean(i.text, 220),
    }))
    .slice(0, 3);
  const result = {
    weekly_summary: clean(out.weekly_summary, 400),
    monthly_summary: clean(out.monthly_summary, 400),
    score_message: clean(out.score_message, 240),
    insights,
  };
  if (!result.weekly_summary || !result.monthly_summary || insights.length < 3) {
    throw new Error("snapshot insights incomplete: " + JSON.stringify(Object.keys(out)));
  }
  return result;
}

/** Simple beginner-friendly fitness plan for a "live healthier" user (no
 *  diabetes context needed). Same shape as generateGymPlan but tuned for a
 *  general prevention/wellness audience — accepts a broader goal set incl.
 *  "improve overall health" and doesn't assume prediabetes. */
export async function generateFitnessPlan(user, answers = {}) {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    "You are a friendly beginner FITNESS COACH designing a simple, safe routine for a user who wants to live healthier. Focus on gradual progression, low-injury moves, and a mix of cardio + light resistance + mobility. Give the plan in this exact shape:\n\n*Your Fitness Plan*\n\n*Weekly schedule:* one line describing which days do what.\n\n*Each session:* bullet list of 5-8 exercises with sets x reps (or minutes). Group them: warm-up, main workout, cool-down.\n\n*Tips:* 2-3 short bullets on form, safety, and how to progress in the next 2-4 weeks.\n\nKeep the whole plan under 250 words. No medical advice; no prescriptions.",
    profileContext(user),
    languageInstruction(lang),
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = `Gym experience: ${answers.experience || "unknown"}\nDays per week available: ${answers.days || "unknown"}\nMain goal: ${answers.goal || "unknown"}`;

  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: payload },
    ],
    { maxTokens: 600 }
  );
}

// ====================================================================
// My Health (spec "Main Menu Revision v2.1", 2026-07)
// Free-text (and image) → structured health records. Every extractor
// returns JSON only; the flow shows the user a confirmation before saving.
// ====================================================================

// Shared runner: sends a system+user prompt, parses the JSON object back.
// Vision endpoints often reject response_format, so jsonMode is skipped when
// an image is attached (we then rely on parseLabJson's tolerant fallback).
async function extractJson(system, text, imageDataUrl = null, maxTokens = 700) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: userContent(text || "", imageDataUrl) },
  ];
  const raw = await complete(messages, {
    maxTokens,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
    jsonMode: !imageDataUrl,
    // Structured output only — no user-facing prose, so use the cheap model.
    cheap: true,
  });
  return parseLabJson(raw) || {};
}

/** Q1 — Health conditions. Returns { conditions: [normalized names] }. */
export async function extractHealthConditions(user, text) {
  const system = `You extract medical conditions from a free-text message for a health-coaching app. Return ONE JSON object only:
{ "conditions": [ string, ... ] }

Rules:
- Normalize to clean, capitalized names (e.g. "Type 2 Diabetes", "High Blood Pressure", "High Cholesterol", "Heart Disease", "Kidney Disease", "Fatty Liver", "PCOS", "Thyroid Disease", "Depression", "Anxiety").
- Recognize any other legitimate medical condition too, not only the examples.
- If the user says they have none / nothing, return an empty array.
- Do NOT invent conditions that were not mentioned. Return valid JSON only.`;
  const out = await extractJson(system, text);
  return { conditions: Array.isArray(out.conditions) ? out.conditions.filter(Boolean) : [] };
}

/** Q2 — Medications (text or photo). Returns { medications: [{name, generic_name, dose, frequency}] }. */
export async function extractHealthMedications(user, text, imageDataUrl = null) {
  const system = `You extract the user's current medicines from their message${imageDataUrl ? " and/or the attached photo of medicine boxes or a prescription" : ""}. Return ONE JSON object only:
{ "medications": [ { "name": string, "generic_name": string|null, "dose": string|null, "frequency": string|null } ] }

Rules:
- "name" = brand or written name. "generic_name" = active ingredient(s) if known, else null.
- "dose" e.g. "50/500 mg", "10 mg", "20 units". "frequency" e.g. "once daily", "twice daily", "with breakfast".
- If a field is unknown, use null. Never invent a medicine that is not present.
- If the user says none, return an empty array. Return valid JSON only.`;
  const out = await extractJson(system, text || "Extract the medicines from the attached image.", imageDataUrl, 800);
  const meds = Array.isArray(out.medications) ? out.medications : [];
  return {
    medications: meds
      .filter((m) => m && m.name)
      .map((m) => ({
        name: String(m.name).trim(),
        generic_name: m.generic_name ? String(m.generic_name).trim() : null,
        dose: m.dose ? String(m.dose).trim() : null,
        frequency: m.frequency ? String(m.frequency).trim() : null,
      })),
  };
}

/** Q3 — Latest health numbers. Returns { metrics: [...] }. */
export async function extractHealthMetrics(user, text) {
  const system = `You extract health measurements from a free-text message. Return ONE JSON object only:
{ "metrics": [ { "metric_type": string, "value": number|null, "secondary_value": number|null, "unit": string|null, "reading_context": string|null, "measurement_date": string|null } ] }

Allowed metric_type values: "hba1c", "glucose", "weight", "height", "blood_pressure", "waist".
Rules:
- HbA1c: value = the percentage number, unit = "%".
- glucose: value = mg/dL number (convert mmol/L to mg/dL by ×18, rounded). unit = "mg_dl". reading_context = "fasting" | "random" | "post_meal" if stated, else null.
- weight: unit = "kg" (convert lb->kg ×0.4536 if needed). height: unit = "cm". waist: unit = "cm".
- blood_pressure: value = systolic, secondary_value = diastolic, unit = "mmHg".
- measurement_date: ISO "YYYY-MM-DD" only if the user gave a concrete date, else null.
- Only include metrics actually present. No value is mandatory. Never invent numbers. Return valid JSON only.`;
  const out = await extractJson(system, text);
  const metrics = Array.isArray(out.metrics) ? out.metrics : [];
  const allowed = new Set(["hba1c", "glucose", "weight", "height", "blood_pressure", "waist"]);
  return { metrics: metrics.filter((m) => m && allowed.has(m.metric_type) && (m.value != null || m.secondary_value != null)).map((m) => ({
    metric_type: m.metric_type,
    value: m.value != null ? Number(m.value) : null,
    secondary_value: m.secondary_value != null ? Number(m.secondary_value) : null,
    unit: m.unit || null,
    reading_context: m.reading_context || null,
    measurement_date: /^\d{4}-\d{2}-\d{2}$/.test(m.measurement_date || "") ? m.measurement_date : null,
  })) };
}

/** Q4 — Lifestyle. Returns { smoking_status, smoking_quantity, activity_level, activity_type }. */
export async function extractLifestyle(user, text) {
  const system = `You extract lifestyle information from a free-text message. Return ONE JSON object only:
{ "smoking_status": "smoker"|"non_smoker"|"ex_smoker"|null,
  "smoking_quantity": string|null,
  "activity_level": string|null,
  "activity_type": string|null }

Rules:
- smoking_quantity: short phrase like "8 cigarettes/day" if given, else null.
- activity_level: short phrase like "3x/week", "daily", "rarely" if given, else null.
- activity_type: e.g. "gym", "walking", "running", "yoga" if mentioned, else null.
- Use null for anything not stated. Return valid JSON only.`;
  const out = await extractJson(system, text);
  return {
    smoking_status: ["smoker", "non_smoker", "ex_smoker"].includes(out.smoking_status) ? out.smoking_status : null,
    smoking_quantity: out.smoking_quantity ? String(out.smoking_quantity).trim() : null,
    activity_level: out.activity_level ? String(out.activity_level).trim() : null,
    activity_type: out.activity_type ? String(out.activity_type).trim() : null,
  };
}

/**
 * Q1 — "About You": gender / age / height / weight from a natural-language
 * reply. Regex-based (no LLM call) — these are simple numeric/enum fields and
 * we don't want to burn tokens on every My Health entry.
 *
 * Returns { gender?, age?, height_cm?, weight_kg?, ackOnly?: true }.
 * `ackOnly` is true when the user just confirmed ("ok", "correct", "yes")
 * without any new data — the caller should accept and move on.
 */
export function extractAboutYou(text) {
  const raw = String(text || "").trim();
  if (!raw) return {};
  const lower = raw.toLowerCase();

  // Bare confirmation — "ok" / "yes" / "correct" / "looks good" / "all good".
  if (/^(ok|okay|k|yes|correct|right|looks good|all good|nothing|no update|no change|nothing to update)\.?$/i.test(raw)) {
    return { ackOnly: true };
  }

  const out = {};

  // Gender: male / female / other. Match whole words so "Female" is fine but
  // "malegorged" (nonsense) isn't. Also accept "M" / "F" as standalone tokens.
  if (/\b(female|woman|f)\b/i.test(raw)) out.gender = "female";
  else if (/\b(male|man)\b/i.test(raw) || /(?<![\d.]\s*)\bm\b/i.test(raw)) out.gender = "male";
  else if (/\b(other|non-?binary|nb)\b/i.test(raw)) out.gender = "other";

  // Weight: "78kg", "76 kg", "weight 76", "wt 76" — prefer explicit "kg" tokens
  // over bare numbers. Convert lbs to kg when explicit.
  const wKg = lower.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kgs?|kilo(?:gram)?s?)\b/);
  const wLb = lower.match(/(\d{2,3}(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/);
  const wLabelled = lower.match(/(?:weight|wt|wgt)[\s:]*?(\d{2,3}(?:\.\d+)?)\b/);
  if (wKg) out.weight_kg = Number(wKg[1]);
  else if (wLb) out.weight_kg = Math.round(Number(wLb[1]) * 0.453592 * 10) / 10;
  else if (wLabelled) out.weight_kg = Number(wLabelled[1]);

  // Height: "174cm" / "1.74m" / "5'8" / "5ft 8in" / "height 174".
  const hCm = lower.match(/(\d{2,3}(?:\.\d+)?)\s*(?:cm|centimet(?:er|re)s?)\b/);
  const hM  = lower.match(/(\d(?:\.\d+)?)\s*m(?:eters?|etres?)?\b/);
  const hFtIn = lower.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})\s*(?:"|in|inch(?:es)?)?/);
  const hFt = lower.match(/(\d(?:\.\d+)?)\s*(?:'|ft|feet)\b/);
  const hLabelled = lower.match(/height[\s:]*?(\d{2,3})\b/);
  if (hCm) out.height_cm = Number(hCm[1]);
  else if (hFtIn) out.height_cm = Math.round(Number(hFtIn[1]) * 30.48 + Number(hFtIn[2]) * 2.54);
  else if (hFt) out.height_cm = Math.round(Number(hFt[1]) * 30.48);
  else if (hM && Number(hM[1]) < 3) out.height_cm = Math.round(Number(hM[1]) * 100);
  else if (hLabelled) out.height_cm = Number(hLabelled[1]);

  // Age: prefer explicit "age 32" / "32 years / yrs old". Fall back to a
  // small standalone number (1–120) only if we haven't already parsed a
  // height/weight above (to avoid grabbing the wrong number).
  // Numbers with no unit and no label ("78 170", "male 78, 170"). Values can
  // be separated by spaces or commas; a number is "unit-less" unless a unit
  // follows it (kg, cm, m, ft, years…) or a label precedes it (weight:,
  // height, age). The My Health flow refuses to guess which of two bare
  // numbers is the weight and asks the user to add units instead.
  const UNIT_AFTER = /^\s*(?:kgs?|kilo|lbs?|pounds?|cm\b|centimet|m\b|meters?|metres?|'|"|ft\b|feet|in\b|inch|years?|yrs?|yo\b|y\b|%)/i;
  const LABEL_BEFORE = /(?:weight|wt|wgt|height|age|ft|feet|')[\s:]*$/i;
  const unitless = [];
  const numRe = /\d+(?:\.\d+)?/g;
  let nm;
  while ((nm = numRe.exec(lower))) {
    const after = lower.slice(nm.index + nm[0].length);
    const before = lower.slice(Math.max(0, nm.index - 12), nm.index);
    if (UNIT_AFTER.test(after) || LABEL_BEFORE.test(before)) continue;
    unitless.push(Number(nm[0]));
  }
  out.ageFromBare = false;

  const aLabelled = lower.match(/\bage[\s:]*?(\d{1,3})\b/);
  const aYearsOld = lower.match(/\b(\d{1,3})\s*(?:years?|yrs?)\s*old\b/);
  const aYearsOnly = lower.match(/\b(\d{1,3})\s*(?:years?|yrs?|yo|y)\b/);
  if (aLabelled) out.age = Number(aLabelled[1]);
  else if (aYearsOld) out.age = Number(aYearsOld[1]);
  else if (aYearsOnly) out.age = Number(aYearsOnly[1]);
  else if (unitless.length === 1) {
    // Exactly one number without a unit or label ("male, 42, 174cm, 78kg",
    // or just "42") — take it as the age. The flow double-checks that
    // height and weight are settled before trusting this (ageFromBare).
    const n = unitless[0];
    if (Number.isInteger(n) && n >= 1 && n <= 120) {
      out.age = n;
      out.ageFromBare = true;
    }
  }
  out.unitless = unitless;

  // Sanity-clip absurd values.
  if (out.age != null && (out.age < 1 || out.age > 120)) delete out.age;
  if (out.height_cm != null && (out.height_cm < 50 || out.height_cm > 250)) delete out.height_cm;
  if (out.weight_kg != null && (out.weight_kg < 20 || out.weight_kg > 300)) delete out.weight_kg;

  return out;
}

/** Q5 — Primary health goal. Returns { goal }. */
export async function extractHealthGoal(user, text) {
  const system = `You extract the ONE main health goal the user wants to improve over the next few months. Return ONE JSON object only:
{ "goal": string }
Rules:
- Keep it short and clear, e.g. "Improve blood sugar", "Lose weight", "Build muscle", "Stay healthy", "Run a 5K".
- Base it on what the user said; do not add unrelated goals. Return valid JSON only.`;
  const out = await extractJson(system, text);
  const goal = out.goal ? String(out.goal).trim().slice(0, 120) : (text || "").trim().slice(0, 120);
  return { goal };
}

/**
 * Completed-profile free-text update router. The user simply tells DrSaab what
 * changed ("my weight is now 79 kg", "I stopped Tagipmet", "diagnosed with
 * fatty liver"); this determines intent(s), extracts values, and returns a
 * normalized change-set plus a concise confirmation line the flow echoes back.
 */
export async function parseHealthUpdate(user, text, imageDataUrl = null) {
  const lang = user?.language || "en";
  const system = `You are DrSaab's health-profile update parser. The user has an existing health profile and is telling you what changed. Determine every relevant change and return ONE JSON object only:

{
  "conditions":  { "add": [string], "remove": [string] },
  "medications": { "add": [ {"name":string,"generic_name":string|null,"dose":string|null,"frequency":string|null} ], "stop": [string] },
  "metrics":     [ {"metric_type":string,"value":number|null,"secondary_value":number|null,"unit":string|null,"reading_context":string|null,"measurement_date":string|null} ],
  "lifestyle":   {"smoking_status":"smoker"|"non_smoker"|"ex_smoker"|null,"smoking_quantity":string|null,"activity_level":string|null,"activity_type":string|null} | null,
  "goal":        string|null,
  "needs_context": "glucose"|null,
  "reply":       string
}

Rules:
- Only fill the sections the user actually referenced; leave the others empty ([] or null).
- Conditions: "also diagnosed with X" -> add:["X"]; normalize names (e.g. "Fatty Liver").
- Medications: "started X" -> add; "stopped/no longer taking X" -> stop:["X"].
- Metrics: same normalization as lab numbers — hba1c(%), glucose(mg_dl; convert mmol/L ×18), weight(kg), height(cm), blood_pressure(systolic=value,diastolic=secondary_value,mmHg), waist(cm). measurement_date only if a concrete date is given.
- needs_context = "glucose" ONLY when the user gave a blood sugar value but did NOT say whether it was fasting, random or post-meal. Otherwise null.
- reply: a SHORT, warm WhatsApp confirmation in ${LANG_NAME[lang] || "English"} of what you understood and updated (no emojis, one or two lines). If nothing health-related was found, set every section empty and make reply a gentle nudge asking them to share a health update.
- Never invent data. Return valid JSON only.`;
  const out = await extractJson(system, text, imageDataUrl, 800);
  const allowed = new Set(["hba1c", "glucose", "weight", "height", "blood_pressure", "waist"]);
  const cond = out.conditions || {};
  const med = out.medications || {};
  return {
    conditions: {
      add: Array.isArray(cond.add) ? cond.add.filter(Boolean).map((s) => String(s).trim()) : [],
      remove: Array.isArray(cond.remove) ? cond.remove.filter(Boolean).map((s) => String(s).trim()) : [],
    },
    medications: {
      add: Array.isArray(med.add)
        ? med.add.filter((m) => m && m.name).map((m) => ({
            name: String(m.name).trim(),
            generic_name: m.generic_name ? String(m.generic_name).trim() : null,
            dose: m.dose ? String(m.dose).trim() : null,
            frequency: m.frequency ? String(m.frequency).trim() : null,
          }))
        : [],
      stop: Array.isArray(med.stop) ? med.stop.filter(Boolean).map((s) => String(s).trim()) : [],
    },
    metrics: Array.isArray(out.metrics)
      ? out.metrics.filter((m) => m && allowed.has(m.metric_type) && (m.value != null || m.secondary_value != null)).map((m) => ({
          metric_type: m.metric_type,
          value: m.value != null ? Number(m.value) : null,
          secondary_value: m.secondary_value != null ? Number(m.secondary_value) : null,
          unit: m.unit || null,
          reading_context: m.reading_context || null,
          measurement_date: /^\d{4}-\d{2}-\d{2}$/.test(m.measurement_date || "") ? m.measurement_date : null,
        }))
      : [],
    lifestyle: out.lifestyle && typeof out.lifestyle === "object"
      ? {
          smoking_status: ["smoker", "non_smoker", "ex_smoker"].includes(out.lifestyle.smoking_status) ? out.lifestyle.smoking_status : null,
          smoking_quantity: out.lifestyle.smoking_quantity ? String(out.lifestyle.smoking_quantity).trim() : null,
          activity_level: out.lifestyle.activity_level ? String(out.lifestyle.activity_level).trim() : null,
          activity_type: out.lifestyle.activity_type ? String(out.lifestyle.activity_type).trim() : null,
        }
      : null,
    goal: out.goal ? String(out.goal).trim().slice(0, 120) : null,
    needs_context: out.needs_context === "glucose" ? "glucose" : null,
    reply: out.reply ? String(out.reply).trim() : "",
  };
}

/** Beginner gym plan for a prediabetes user. Uses the three onboarding
 *  answers plus their profile so the routine matches age, weight and goal. */
export async function generateGymPlan(user, answers = {}) {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    "You are a friendly beginner FITNESS COACH designing a simple, safe gym routine for a user with prediabetes. Focus on gradual progression, low-injury moves, and blood-sugar friendly cardio + light resistance. Give the plan in this exact shape:\n\n*Your Gym Plan*\n\n*Weekly schedule:* one line describing which days do what.\n\n*Each session:* bullet list of 5-8 exercises with sets x reps (or minutes). Group them: warm-up, main workout, cool-down.\n\n*Tips:* 2-3 short bullets on form, safety, and how to progress in the next 2-4 weeks.\n\nKeep the whole plan under 250 words. No medical advice; no prescriptions.",
    profileContext(user),
    languageInstruction(lang),
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = `Gym experience: ${answers.experience || "unknown"}\nDays per week available: ${answers.days || "unknown"}\nMain goal: ${answers.goal || "unknown"}`;

  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: payload },
    ],
    { maxTokens: 600 }
  );
}
