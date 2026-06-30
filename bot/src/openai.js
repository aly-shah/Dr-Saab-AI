import OpenAI from "openai";
import { config } from "./config.js";
import { logError } from "./log.js";
import { describeLlmError } from "./errors.js";

// OpenAI-compatible client. Points at Groq when GROQ_API_KEY is set.
const client = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
});

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
  if (user?.height_cm) parts.push(`Height: ${user.height_cm} cm`);
  if (user?.weight_kg) parts.push(`Weight: ${user.weight_kg} kg`);
  if (user?.goals) parts.push(`Goals: ${user.goals}`);
  if (user?.medications) parts.push(`Medications: ${user.medications}`);
  if (user?.city) parts.push(`City: ${user.city} (consider locally common foods)`);
  return parts.length ? `User profile:\n${parts.join("\n")}` : "No profile details yet.";
}

const KIND_ROLE = {
  coach:
    "Focus on overall diabetes self-management: blood sugar patterns, habits, motivation, accountability and consistency.",
  food:
    "You are the FOOD COACH. When given a meal (text or photo), estimate carbohydrate load and glycemic impact, flag concerns, and suggest healthier swaps using foods common to the user's region. Be specific and practical.",
  fitness:
    "You are the FITNESS COACH. Suggest safe, realistic movement for someone with the user's profile (e.g. short post-meal walks, light strength work). Respect any limitations and keep goals achievable.",
};

async function complete(messages, { maxTokens = 600, model } = {}) {
  const usedModel = model || config.llm.model;
  try {
    const res = await client.chat.completions.create({
      model: usedModel,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    });
    return res.choices[0]?.message?.content?.trim() || "";
  } catch (e) {
    // Explain the real cause in red (e.g. "GROQ rate limit hit (429)…") so it's
    // obvious in the logs why a reply failed. Flows still show the user a
    // friendly generic message and continue.
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

/** One-shot lab report explanation (text and/or photo). */
export async function explainLab(user, text, imageDataUrl = null) {
  const lang = user?.language || "en";
  const system = [
    SAFETY,
    `You are explaining a LAB REPORT in plain language. For each value the user shares: say what it measures, whether it looks low / normal / high in general terms, and what lifestyle steps may help. Group HbA1c, fasting glucose, lipids, kidney (creatinine/eGFR) and liver values if present. End with a clear reminder to review results with their own doctor. Do NOT give a diagnosis.`,
    profileContext(user),
    languageInstruction(lang),
  ].join("\n\n");

  const messages = [
    { role: "system", content: system },
    {
      role: "user",
      content: userContent(
        text || "Please explain my lab report from the attached image.",
        imageDataUrl
      ),
    },
  ];
  return complete(messages, {
    maxTokens: 900,
    model: imageDataUrl ? config.llm.visionModel : config.llm.model,
  });
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
