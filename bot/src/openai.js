import OpenAI from "openai";
import https from "node:https";
import nodeFetch from "node-fetch";
import { config } from "./config.js";
import { logError } from "./log.js";
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

// Optional second client used only for paid Ask DrSaab (spec: paid tier hits
// OpenAI directly for richer reasoning/memory). Only exists when both a Groq
// key and an OpenAI key are configured — otherwise paid users share `client`.
const paidClient = config.llm.paidApiKey
  ? new OpenAI({ apiKey: config.llm.paidApiKey, maxRetries: 4, timeout: 60_000, fetch: resilientFetch })
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
    "You are the FOOD COACH. When given a meal (text or photo), estimate carbohydrate load and glycemic impact, flag concerns, and suggest healthier swaps using foods common to the user's region. Be specific and practical.",
  analyze:
    "You are the MEAL ANALYSER. The user will describe a meal (text) or send a photo of a plate. Estimate the meal for one typical serving and reply in this EXACT structure, no preamble:\n\n*Meal:* (one-line description of what you see)\n*Per serving (estimate):*\n• Calories: …\n• Carbohydrates: …\n• Protein: …\n• Fat: …\n• Fibre: … (skip this line if you cannot tell)\n\n*Blood sugar impact:* 🟢 Low / 🟡 Moderate / 🔴 High — then explain in ONE line why.\n*Portion advice:* one line.\n*Suggested improvements:* 1–3 concise bullets.\n*Well done:* one short line of positive reinforcement — only when the meal is a genuinely good choice.\n\nNever present estimates as exact nutrition facts. Use foods common to the user's region. Keep it WhatsApp-length. End with: ✅ Meal analysed.",
  label:
    "You are the NUTRITION LABEL ANALYST. The user will send a photo of a Nutrition Facts label or ingredients list on a packaged food. Extract: calories, carbohydrates, added sugars (if listed), fibre, protein, and serving size. Ignore marketing claims like 'Sugar Free', 'Low Fat' or 'Healthy' — rely only on the panel and ingredients. Reply in this exact structure:\n\n• *Product:* (name if visible)\n• *Serving:* (size)\n• *Per serving:* Calories … | Carbs … | Added sugar … | Fibre … | Protein …\n\n*Rating:* choose one of 🟢 Good Choice / 🟡 Okay Occasionally / 🔴 Best to Limit — then explain in ONE line why.\n*Suggested serving:* one line.\n*Healthier alternative:* one line (skip if unnecessary).\n\nKeep language simple, non-technical, WhatsApp-length. End with: ✅ Nutrition label analysed.",
  fitness:
    "You are the FITNESS COACH. Suggest safe, realistic movement for someone with the user's profile (e.g. short post-meal walks, light strength work). Respect any limitations and keep goals achievable.",
};

async function complete(messages, { maxTokens = 600, model, jsonMode = false, paid = false } = {}) {
  const useOpenAI = paid && paidClient;
  const chosenClient = useOpenAI ? paidClient : client;
  const usedModel =
    model || (useOpenAI ? config.llm.paidModel : null) || config.llm.model;
  try {
    const req = {
      model: usedModel,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    };
    if (jsonMode) req.response_format = { type: "json_object" };
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
    logError(`${config.llm.provider.toUpperCase()} LLM`, describeLlmError(e, config.llm.provider, usedModel));
    throw e;
  }
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
    ...history.slice(-10),
    { role: "user", content: userContent(text, imageDataUrl) },
  ];
  return complete(messages, {
    maxTokens: 700,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
  });
}

/**
 * Ask DrSaab open-ended reply. Same conversational shape as `coachReply` but
 * with the broader DrSaab persona and richer personalization. Paid users are
 * routed to the OpenAI-backed model when configured (see config.llm.paidApiKey).
 *
 * @param {object} user           user row
 * @param {Array}  history        [{role, content}] prior turns (text only)
 * @param {string} text           latest user text
 * @param {object} [opts]
 * @param {string} [opts.imageDataUrl] optional data URI for vision
 * @param {string} [opts.personalCtx]  compact personalisation block
 * @param {boolean}[opts.paid]         true → route to paid model when available
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
    ...history.slice(-12),
    { role: "user", content: userContent(text, imageDataUrl) },
  ];

  // Vision always uses the vision model on the free/Groq client — OpenAI paid
  // routing only applies to text turns.
  if (imageDataUrl) {
    return complete(messages, { maxTokens: 700, model: config.llm.visionModel });
  }
  return complete(messages, { maxTokens: paid ? 800 : 500, paid });
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
- Prioritize these tests where present: HbA1c, fasting glucose, random glucose, LDL, HDL, total cholesterol, triglycerides, creatinine, eGFR, urea, ALT/SGPT, AST/SGOT, urine albumin, urine microalbumin, and any CBC values.
- If the source is unreadable or missing a field, leave it null. Do not invent values.
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
    maxTokens: 1500,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
    jsonMode: !imageDataUrl, // vision endpoints often reject response_format
  });

  const parsed = parseLabJson(raw);
  return {
    analysis: parsed.analysis || raw, // fall back to raw text if JSON parse failed
    metadata: parsed.metadata || null,
    values: Array.isArray(parsed.values) ? parsed.values : null,
    labSource: parsed.lab_source || null,
  };
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

/**
 * Personalised Progress report. Two variants driven by the same underlying
 * data blob so we don't fork the whole pipeline.
 *
 *   variant = "free"  → 5-8 line motivating summary (blood sugar / activity /
 *                       weight callouts) that answers "what improved?" and
 *                       "how close to the goal?" at a high level. Ends with a
 *                       gentle nudge — the free/paid upsell UI is added by
 *                       the caller.
 *
 *   variant = "paid"  → Comprehensive markdown report:
 *                         1. Goal Progress (per active goal, with % if
 *                            possible from the data)
 *                         2. Biggest Win
 *                         3. Biggest Opportunity
 *                         4. Personalised Recommendations (3–5 bullets)
 *                       All four framing questions from the spec must be
 *                       answerable from the response.
 *
 * `data` fields (all optional): goals, motivation, glucose{avg,inRangePct,
 * count,recent}, weight, weightTrend, activityCount, medicationCount,
 * wellbeing, labSummary, streak, hba1c.
 */
export async function progressReport(user, data, variant = "paid") {
  const lang = user?.language || "en";
  const framing = `The report must be encouraging, practical and goal-oriented — not just statistics. It must implicitly answer four questions:\n1. What has improved for this user?\n2. What needs attention?\n3. How close are they to achieving each goal?\n4. What is the single most important thing they should focus on next?`;

  const persona = variant === "free"
    ? `Write a short 5-8 line MOTIVATING progress summary in ${LANG_NAME[lang] || "English"}. Use plain markdown with a few emoji (✅ / ⚠️ / 📈). Celebrate at least one improvement, gently flag one area to watch, and close by connecting to their goal. Do NOT include the words "Biggest Win" / "Biggest Opportunity" / "Recommendations" — that's the paid version. Keep it under 8 short lines.`
    : `Write a COMPREHENSIVE progress report in ${LANG_NAME[lang] || "English"} using this exact structure and Markdown headings:\n\n*Goal Progress*\n(For each active goal in the data, one line: current status + % complete if the numbers support it, else a qualitative "on track / needs push / early days".)\n\n*Biggest Win*\n(One or two sentences on their strongest positive trend since the last report.)\n\n*Biggest Opportunity*\n(The single highest-impact habit change they could make to move toward their goal.)\n\n*Personalised Recommendations*\n(3–5 concrete bullets grounded in the data. Whenever appropriate, reference the user's stated motivation ("You mentioned that you want to be healthier for your children…").)\n\nEnd with a short encouraging sign-off line.`;

  const system = [SAFETY, framing, persona, profileContext(user)]
    .filter(Boolean)
    .join("\n\n");

  const goalsBlock = (data.goals || []).length
    ? data.goals.map((g, i) => {
        const parts = [`${i + 1}. ${g.title}`];
        if (g.motivation) parts.push(`   motivation: ${g.motivation}`);
        if (g.target_date) parts.push(`   target date: ${g.target_date}`);
        else if (g.target_hint) parts.push(`   target: ${g.target_hint}`);
        return parts.join("\n");
      }).join("\n")
    : "(no active goals set)";

  const payload = `Active goals:\n${goalsBlock}\n\nRecent data (last 30 days unless noted):\n- Glucose readings logged: ${data.glucoseCount ?? 0}\n- Average glucose: ${data.glucoseAvg ?? "no data"} mg/dL\n- In-range percentage: ${data.inRangePct ?? "no data"}%\n- Estimated HbA1c: ${data.hba1c ?? "no data"}\n- Latest self-reported HbA1c: ${user?.latest_hba1c ?? "unknown"}\n- Weight: ${data.weight ?? "no data"} kg  (trend: ${data.weightTrend ?? "insufficient data"})\n- Activity entries: ${data.activityCount ?? 0}\n- Medication logs: ${data.medicationCount ?? 0}\n- Wellbeing check-ins: ${data.wellbeingCount ?? 0}\n- Lab summary: ${data.labSummary || "no recent lab reports"}\n- Current streak: ${data.streak ?? user?.streak ?? 0} day(s)\n\nUser motivation driver from profile: ${user?.motivation_driver || "unknown"}`;

  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: payload },
    ],
    { maxTokens: variant === "free" ? 400 : 900 }
  );
}

/** Weekly summary written from computed stats. */
export async function weeklySummary(user, stats) {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    "Write a short, motivating WEEKLY HEALTH SUMMARY (5-8 lines) from the user's data. Celebrate consistency, gently flag anything to watch, and give ONE concrete focus for next week. Use a friendly tone with a couple of emoji.",
    languageInstruction(lang),
  ].join("\n\n");

  const data = `This week's data:
- Glucose readings logged: ${stats.glucoseCount}
- Average glucose: ${stats.glucoseAvg ?? "no data"} mg/dL
- Range: ${stats.glucoseMin ?? "-"}–${stats.glucoseMax ?? "-"} mg/dL
- Medication logs: ${stats.medicationCount}
- Daily check-ins: ${stats.healthCount}
- Current streak: ${user.streak || 0} day(s)`;

  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: data },
    ],
    { maxTokens: 500 }
  );
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
