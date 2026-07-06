import { t } from "../i18n.js";
import { send, langOf, sanitizeMd } from "../utils.js";
import {
  t1CommunityKeyboard,
  t1DailyLifeCategoriesKeyboard,
  t1DailyLifeTopicsKeyboard,
  backKeyboard,
} from "../keyboards.js";
import {
  listT1Organizations,
  listT1Articles,
  listT1Videos,
  listT1DailyLifeTopics,
  getT1DailyLifeTopic,
  listT1Events,
} from "../supabase.js";

// Only T1 users should reach this flow. Callers are already gated by the
// profile button (`pfl:type1`); this guard is defence-in-depth for deep links.
function isType1(session) {
  return session?.user?.diabetes_status === "type1";
}

export async function showT1Community(bot, chatId, session) {
  const lang = langOf(session);
  if (!isType1(session)) {
    return send(bot, chatId, t(lang, "t1c_menu_not_t1"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  await send(bot, chatId, `${t(lang, "t1c_menu_title")}\n\n${t(lang, "t1c_menu_intro")}`, {
    keyboard: t1CommunityKeyboard(lang),
    markdown: true,
  });
}

function backToT1(lang) {
  return backKeyboard(lang, "feat:t1community");
}

function emptyBody(lang) {
  return t(lang, "t1c_placeholder_body");
}

async function showSupport(bot, chatId, session) {
  const lang = langOf(session);
  const orgs = await listT1Organizations().catch(() => []);
  if (!orgs.length) {
    return send(bot, chatId, `${t(lang, "t1c_support_title")}\n\n${emptyBody(lang)}`, {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  const lines = orgs.map((o) => {
    const parts = [`• *${sanitizeMd(o.name)}*`];
    if (o.description) parts.push(`  ${sanitizeMd(o.description)}`);
    if (o.website) parts.push(`  🌐 ${o.website}`);
    if (o.contact) parts.push(`  ☎️ ${sanitizeMd(o.contact)}`);
    const socials = [
      o.facebook_url && `FB: ${o.facebook_url}`,
      o.instagram_url && `IG: ${o.instagram_url}`,
      o.twitter_url && `X: ${o.twitter_url}`,
      o.youtube_url && `YT: ${o.youtube_url}`,
    ].filter(Boolean);
    if (socials.length) parts.push(`  ${socials.join(" · ")}`);
    return parts.join("\n");
  });
  const text = `${t(lang, "t1c_support_title")}\n\n${lines.join("\n\n")}`;
  await send(bot, chatId, text, { keyboard: backToT1(lang), markdown: true });
}

async function showBlogs(bot, chatId, session) {
  const lang = langOf(session);
  const articles = await listT1Articles(10).catch(() => []);
  if (!articles.length) {
    return send(bot, chatId, `${t(lang, "t1c_blogs_title")}\n\n${emptyBody(lang)}`, {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  const lines = articles.map((a) => {
    const src = a.source ? ` — _${sanitizeMd(a.source)}_` : "";
    const summary = a.summary ? `\n  ${sanitizeMd(a.summary)}` : "";
    return `• *${sanitizeMd(a.title)}*${src}${summary}\n  ${a.url}`;
  });
  const text = `${t(lang, "t1c_blogs_title")}\n\n${lines.join("\n\n")}`;
  await send(bot, chatId, text, { keyboard: backToT1(lang), markdown: true });
}

async function showVideos(bot, chatId, session) {
  const lang = langOf(session);
  const videos = await listT1Videos(10).catch(() => []);
  if (!videos.length) {
    return send(bot, chatId, `${t(lang, "t1c_videos_title")}\n\n${emptyBody(lang)}`, {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  const lines = videos.map((v) => {
    const src = v.source ? ` — _${sanitizeMd(v.source)}_` : "";
    const desc = v.description ? `\n  ${sanitizeMd(v.description)}` : "";
    return `• *${sanitizeMd(v.title)}*${src}${desc}\n  ${v.url}`;
  });
  const text = `${t(lang, "t1c_videos_title")}\n\n${lines.join("\n\n")}`;
  await send(bot, chatId, text, { keyboard: backToT1(lang), markdown: true });
}

// Daily Life is two-level: category → topic. Category screen is always shown;
// even if a category has no topics yet we let the user drill in so it's clear
// which sections are coming.
async function showDailyLifeCategories(bot, chatId, session) {
  const lang = langOf(session);
  await send(bot, chatId, `${t(lang, "t1c_dailylife_title")}\n\n${t(lang, "t1c_dailylife_intro")}`, {
    keyboard: t1DailyLifeCategoriesKeyboard(lang),
    markdown: true,
  });
}

async function showDailyLifeCategory(bot, chatId, session, category) {
  const lang = langOf(session);
  const titleKey = {
    children_parents: "t1c_dl_cat_children",
    teens_young_adults: "t1c_dl_cat_teens",
    adults: "t1c_dl_cat_adults",
  }[category];
  if (!titleKey) return showDailyLifeCategories(bot, chatId, session);

  const topics = await listT1DailyLifeTopics(category).catch(() => []);
  if (!topics.length) {
    return send(bot, chatId, `${t(lang, titleKey)}\n\n${emptyBody(lang)}`, {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  await send(bot, chatId, `${t(lang, titleKey)}\n\n${t(lang, "t1c_dl_pick_topic")}`, {
    keyboard: t1DailyLifeTopicsKeyboard(lang, topics),
    markdown: true,
  });
}

async function sendDailyLifeTopic(bot, chatId, session, idStr) {
  const lang = langOf(session);
  const id = parseInt(idStr, 10);
  if (!Number.isInteger(id)) return showDailyLifeCategories(bot, chatId, session);
  const topic = await getT1DailyLifeTopic(id).catch(() => null);
  if (!topic) {
    return send(bot, chatId, t(lang, "t1c_dl_topic_missing"), {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  const title = sanitizeMd(topic.title);
  if (!topic.pdf_url) {
    return send(bot, chatId, t(lang, "t1c_dl_topic_no_pdf", { title }), {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  await send(bot, chatId, t(lang, "t1c_dl_topic_open", { title, url: topic.pdf_url }), {
    keyboard: backToT1(lang),
    markdown: true,
  });
}

async function showEvents(bot, chatId, session) {
  const lang = langOf(session);
  const events = await listT1Events(20).catch(() => []);
  if (!events.length) {
    return send(bot, chatId, `${t(lang, "t1c_events_title")}\n\n${emptyBody(lang)}`, {
      keyboard: backToT1(lang),
      markdown: true,
    });
  }
  const lines = events.map((e) => {
    const linkLine = e.url ? `\n  ${e.url}` : "";
    return `• ${sanitizeMd(e.description)}${linkLine}`;
  });
  const text = `${t(lang, "t1c_events_title")}\n\n${lines.join("\n\n")}`;
  await send(bot, chatId, text, { keyboard: backToT1(lang), markdown: true });
}

export async function dispatchT1Community(bot, chatId, session, action) {
  if (!isType1(session)) return showT1Community(bot, chatId, session);

  if (action === "menu") return showT1Community(bot, chatId, session);
  if (action === "support") return showSupport(bot, chatId, session);
  if (action === "blogs") return showBlogs(bot, chatId, session);
  if (action === "videos") return showVideos(bot, chatId, session);
  if (action === "dailylife") return showDailyLifeCategories(bot, chatId, session);
  if (action === "events") return showEvents(bot, chatId, session);
  if (action.startsWith("dl:")) return showDailyLifeCategory(bot, chatId, session, action.slice(3));
  if (action.startsWith("dt:")) return sendDailyLifeTopic(bot, chatId, session, action.slice(3));

  return showT1Community(bot, chatId, session);
}
