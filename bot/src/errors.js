// Translates raw provider/SDK errors into explicit, human-readable sentences
// so the red log line says *what* actually broke and *what to check* — instead
// of "Request failed with status code 429".

// ---- LLM (OpenAI-compatible: Groq / OpenAI) --------------------------------
export function describeLlmError(err, provider = "LLM", model = "") {
  const P = provider.toUpperCase();
  const keyHint = P === "GROQ" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
  const status = err?.status ?? err?.response?.status;
  const apiMsg = err?.error?.message || err?.response?.data?.error?.message || err?.message || "";

  // Network / DNS level (no HTTP status)
  if (err?.code === "ENOTFOUND" || err?.code === "EAI_AGAIN")
    return `cannot reach ${provider} (DNS/network failure). Check internet access and LLM_BASE_URL.`;
  if (err?.code === "ECONNREFUSED")
    return `${provider} refused the connection. Check LLM_BASE_URL is correct.`;
  if (err?.code === "ETIMEDOUT" || /timed?\s*out|timeout/i.test(apiMsg))
    return `${provider} request timed out. The provider may be slow or unreachable.`;

  switch (status) {
    case 401:
      return `${provider} rejected the API key (401 unauthorized). Check ${keyHint} is set and valid.`;
    case 403:
      return `${provider} access forbidden (403). The key lacks permission, or model "${model}" is restricted.`;
    case 404:
      return `${provider} model not found (404): "${model}". Check LLM_MODEL / LLM_VISION_MODEL.`;
    case 413:
      return `${provider} request too large (413) — the message or image exceeds the size limit.`;
    case 422:
      return `${provider} could not process the request (422): ${apiMsg || "unprocessable"}.`;
    case 400:
      // Vision-on-text-model and context-length errors land here most often.
      if (/image|vision|multimodal/i.test(apiMsg))
        return `${provider} model "${model}" does not support images (400). Set LLM_VISION_MODEL to a vision model.`;
      if (/context length|maximum context|too long|tokens/i.test(apiMsg))
        return `${provider} context too long (400) — the conversation/image is too big for "${model}".`;
      return `${provider} rejected the request (400): ${apiMsg || "bad request"}.`;
    case 429:
      if (/quota|insufficient|credit|billing|exceeded your current/i.test(apiMsg))
        return `${provider} quota/credit exhausted (429). Top up or wait for the quota to reset. ${apiMsg}`.trim();
      return `${provider} rate limit hit (429) — too many requests or the daily/token limit was reached. It should recover after a short wait. ${apiMsg}`.trim();
    case 500:
    case 502:
    case 503:
    case 529:
      return `${provider} is temporarily unavailable (${status}). This is on the provider's side — retry shortly.`;
  }
  return `${provider} call failed${status ? ` (HTTP ${status})` : ""}: ${apiMsg || err?.code || "unknown error"}.`;
}

// Map an LLM error onto the user-facing i18n key that best explains it.
// Flows use this instead of a hard-coded "error_generic" so the user sees a
// meaningful message ("AI is busy" vs "AI is down" vs "your file is too big")
// while the raw cause still lands in the red log via describeLlmError().
export function errorKey(err) {
  if (err?.aiCreditsExhausted) return "error_ai_credits";
  if (err?.aiLimited) return "error_ai_limit";
  const status = err?.status ?? err?.response?.status;
  const code = err?.code || err?.cause?.code;
  const msg = err?.message || err?.error?.message || "";
  if (status === 413 || /too\s*large|payload too large/i.test(msg)) return "error_too_large";
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 422
  )
    return "error_ai_config";
  if (status >= 500 && status < 600) return "error_ai_unavailable";
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "UND_ERR_SOCKET" ||
    /premature|socket hang up|fetch failed|network|timed?\s*out|aborted|terminated/i.test(msg)
  )
    return "error_ai_unavailable";
  return "error_generic";
}

// ---- WhatsApp Cloud API (Meta direct / 360dialog) --------------------------
export function describeWhatsAppError(status, body, provider = "meta") {
  let msg = typeof body === "string" ? body : "";
  let code;
  try {
    const j = typeof body === "string" ? JSON.parse(body) : body;
    msg = j?.error?.message || j?.message || msg;
    code = j?.error?.code ?? j?.code;
  } catch {
    /* body wasn't JSON — keep the raw text */
  }
  const authHint =
    provider === "360dialog"
      ? "check D360_API_KEY"
      : "check WHATSAPP_TOKEN (it may be expired) and WHATSAPP_PHONE_NUMBER_ID";

  if (status === 401 || status === 403 || code === 0 || code === 190)
    return `authentication rejected (${status}) — ${authHint}. ${msg}`.trim();
  if (code === 131047 || /re-?engagement|24\s*hour|outside.*window|message template/i.test(msg))
    return `outside the 24-hour customer window — you can only reach this user with a pre-approved message template right now. ${msg}`.trim();
  if (code === 131030 || /not in allowed list|recipient phone number not/i.test(msg))
    return `recipient not allowed — in test mode the destination number must be added to your allowed list. ${msg}`.trim();
  if (code === 132000 || /template/i.test(msg))
    return `template problem — the message template is missing, not approved, or has wrong parameters. ${msg}`.trim();
  if (status === 429 || code === 131048 || code === 80007 || code === 130429)
    return `rate / throughput limit hit (${status}). Slow down sending and retry. ${msg}`.trim();
  if (status >= 500)
    return `WhatsApp API is temporarily unavailable (${status}) — retry shortly. ${msg}`.trim();
  return `API error (${status})${code != null ? ` code ${code}` : ""}: ${msg || "unknown error"}.`;
}

// ---- Telegram (node-telegram-bot-api) --------------------------------------
export function describeTelegramError(err) {
  const apiMsg = err?.response?.body?.description || err?.message || "";
  const status = err?.response?.statusCode ?? err?.response?.body?.error_code;
  if (/401|unauthorized/i.test(`${status} ${apiMsg}`))
    return `bot token rejected (401 unauthorized). Check TELEGRAM_BOT_TOKEN.`;
  if (/409|conflict|terminated by other/i.test(`${status} ${apiMsg}`))
    return `conflict (409) — another instance is polling with the same token, or a webhook is still set.`;
  if (err?.code === "EFATAL" || err?.code === "ENOTFOUND" || /network|ETIMEDOUT|ECONNRESET/i.test(`${err?.code} ${apiMsg}`))
    return `network problem reaching Telegram (${err?.code || "network error"}).`;
  return `${apiMsg || err?.code || "unknown error"}${status ? ` (${status})` : ""}.`;
}
