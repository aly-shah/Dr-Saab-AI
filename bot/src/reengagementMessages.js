// Re-engagement message library — Messaging System Developer Specification
// v1.0 (15 Sep 2026), sections 5–11.
//
// Six pre-approved messages (3 cycles × feature / behaviour), each written
// in five age-appropriate variants. Static by design: no AI, so behaviour is
// predictable and QA-able. Only tone and framing change between brackets;
// the subject stays the same.
//
//   Cycle 1 — Feature: Glucose Logging       Behaviour: Consistency
//   Cycle 2 — Feature: Explain My Report     Behaviour: Opportunity
//   Cycle 3 — Feature: My Health Snapshot    Behaviour: Motivation

export const AGE_BRACKETS = {
  A: { label: "16-24", min: 0, max: 24 },
  B: { label: "25-34", min: 25, max: 34 },
  C: { label: "35-49", min: 35, max: 49 },
  D: { label: "50-65", min: 50, max: 65 },
  E: { label: "66+", min: 66, max: 200 },
};
// Users with no usable age get the neutral, practical middle bracket.
export const DEFAULT_BRACKET = "C";

export const PROMPT_LABELS = {
  "1:feature": "Glucose Logging",
  "1:behaviour": "Consistency",
  "2:feature": "Explain My Report",
  "2:behaviour": "Opportunity",
  "3:feature": "My Health Snapshot",
  "3:behaviour": "Motivation",
};

const N = "{{first_name}}";

export const MESSAGES = {
  1: {
    feature: {
      A: `Hey ${N} 👋 Small habits add up. Logging your sugar in DrSaab takes just a few seconds, but over time it helps you spot what's actually affecting your numbers. Just tell me your reading whenever you check it.`,
      B: `${N}, keeping track of your glucose doesn't need to feel like another task on your list. Just send DrSaab your reading and we'll keep the record for you. Over time, those numbers can reveal useful patterns.`,
      C: `${N}, one glucose reading tells you what's happening now. A history of readings can tell you much more. Send your readings to DrSaab and we'll help you keep track of the bigger picture.`,
      D: `${N}, regularly recording your blood sugar is one of the simplest ways to understand how you're doing. Send your reading to DrSaab whenever you check it, and we'll help you keep track over time.`,
      E: `${N}, keeping a record of your sugar readings can make managing diabetes easier. Whenever you check your sugar, simply send the number to DrSaab. We'll keep the record for you.`,
    },
    behaviour: {
      A: `You don't have to be perfect, ${N}. You just have to keep showing up. 💪 Small healthy choices repeated regularly can make a big difference. DrSaab is here to help you stay consistent, one day at a time.`,
      B: `Better health rarely comes from doing everything perfectly. It comes from doing the important things consistently. DrSaab helps you keep those small actions going - even on busy days.`,
      C: `${N}, consistency often matters more than intensity. Regularly checking your health, staying active and making better food choices all add up. DrSaab is here to help you keep those habits going.`,
      D: `Improving your health doesn't require changing everything overnight. Small actions, done consistently, can make a meaningful difference. DrSaab helps you keep track and stay on course.`,
      E: `${N}, good health is built through small habits practiced regularly. Taking your medicines, checking your sugar and staying active all matter. DrSaab is here to help you keep up those healthy routines.`,
    },
  },
  2: {
    feature: {
      A: `Got a lab report full of numbers that make no sense? 🧪 Send it to DrSaab. Explain My Report breaks it down into simple language so you can understand what the results are actually saying.`,
      B: `Lab reports shouldn't require a medical degree to understand. Upload yours to DrSaab's Explain My Report and we'll break down the key results into straightforward language.`,
      C: `${N}, your lab results can tell you a lot about your health - but they're not always easy to understand. Upload a report to Explain My Report and DrSaab will help make sense of the key numbers.`,
      D: `Understanding your test results can help you have better conversations about your health. Upload your lab report to DrSaab's Explain My Report and we'll explain the important results in simple language.`,
      E: `${N}, medical reports can sometimes be difficult to understand. You can send your lab report to DrSaab and Explain My Report will explain the important results in simpler language. You can then discuss any concerns with your doctor.`,
    },
    behaviour: {
      A: `Getting healthier doesn't always mean changing your whole routine. Look for opportunities already in your day - a short walk, water instead of a sugary drink, or a better snack. DrSaab can help you find the small wins.`,
      B: `Busy day? Use the opportunities already around you. Walk for 10 minutes, make one better meal choice, or check your sugar when you have a moment. DrSaab helps turn those small opportunities into healthier habits.`,
      C: `Healthy changes are easier when they fit into the life you already have. A walk after dinner, a better lunch choice or remembering a health check can all become opportunities to improve. DrSaab helps you identify and build on them.`,
      D: `Every day gives us small opportunities to look after our health - a little more movement, a healthier meal or remembering to check our numbers. DrSaab helps you turn those opportunities into regular habits.`,
      E: `${N}, small opportunities during the day can help you stay healthy. A short walk, choosing a healthier meal or checking your sugar are all useful steps. DrSaab can help you keep track of them.`,
    },
  },
  3: {
    feature: {
      A: `Want the quick version of how you're doing? ⚡ My Health Snapshot brings your key health information together so you can see your progress without digging through old readings and reports.`,
      B: `Your health data is more useful when you can actually see the bigger picture. My Health Snapshot brings your key DrSaab information together so you can quickly see how you're doing.`,
      C: `${N}, readings, weight, activity and other health information become more useful when viewed together. My Health Snapshot gives you a simple overview of the health information you've recorded with DrSaab.`,
      D: `It's easier to manage your health when you can see the overall picture. My Health Snapshot brings your key health information together so you can review your progress in one place.`,
      E: `${N}, DrSaab can keep your important health information together for you. My Health Snapshot gives you a simple summary so it's easier to see how you've been doing.`,
    },
    behaviour: {
      A: `Motivation comes and goes - and that's normal. Don't wait until you 'feel motivated.' Pick one small thing you can do today and build from there. DrSaab will help you keep moving. 🚀`,
      B: `You won't feel motivated every day. That's why small routines matter. Pick one manageable health action today and let DrSaab help you keep the momentum going.`,
      C: `${N}, motivation is useful for getting started, but habits are what keep progress going. Focus on one achievable health action at a time. DrSaab can help you track the progress along the way.`,
      D: `Staying motivated can be difficult when results take time. Focus on the progress you're making through small, regular actions. DrSaab is here to help you keep track and keep moving forward.`,
      E: `${N}, looking after your health is a journey, and every positive step counts. Don't worry about doing everything at once. Keep taking small steps, and DrSaab will help you stay on track.`,
    },
  },
};

// Age in whole years from the free-text date_of_birth column, else the
// numeric age column. Accepts ISO dates, dd/mm/yyyy and a bare year.
export function ageOf(user, now = new Date()) {
  const dob = String(user?.date_of_birth || "").trim();
  if (dob) {
    let d = null;
    const dmy = dob.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (dmy) d = new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
    else if (/^\d{4}$/.test(dob)) d = new Date(Date.UTC(Number(dob), 6, 1));
    else if (!Number.isNaN(Date.parse(dob))) d = new Date(dob);
    if (d && !Number.isNaN(d.getTime())) {
      const years = (now.getTime() - d.getTime()) / (365.25 * 86400000);
      if (years > 0 && years < 130) return Math.floor(years);
    }
  }
  const a = Number(user?.age);
  return Number.isFinite(a) && a > 0 ? Math.floor(a) : null;
}

export function ageBracketFor(user, now = new Date()) {
  const age = ageOf(user, now);
  if (age == null) return DEFAULT_BRACKET;
  for (const [code, b] of Object.entries(AGE_BRACKETS)) if (age >= b.min && age <= b.max) return code;
  return DEFAULT_BRACKET;
}

// Fill {{first_name}} — or, when the name is unknown, drop the greeting
// slot without leaving a dangling comma ("{{first_name}}, keeping…" →
// "Keeping…", "…perfect, {{first_name}}." → "…perfect.").
export function renderMessage(template, firstName) {
  let s = String(template || "");
  const name = String(firstName || "").trim();
  if (name) return s.split(N).join(name);
  s = s.replace(/, \{\{first_name\}\}/g, "");
  s = s.replace(/\{\{first_name\}\},? ?/g, "");
  s = s.replace(/^(\w)/, (m) => m.toUpperCase());
  return s.replace(/ {2,}/g, " ").trim();
}

export function messageFor({ cycle, type, bracket, firstName }) {
  const t = MESSAGES[cycle]?.[type]?.[bracket] || MESSAGES[cycle]?.[type]?.[DEFAULT_BRACKET];
  if (!t) return null;
  return renderMessage(t, firstName);
}
