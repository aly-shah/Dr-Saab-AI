// Colored, leveled console logging.
//
// The goal: when something goes wrong that could stop the bot from working
// (a hit Groq rate limit, a bad API key, an expired WhatsApp token, a 24-hour
// window violation, a dead database…), print an EXPLICIT message in RED that
// names the actual problem — instead of a terse stack trace an operator has to
// decode. Warnings are yellow; successes green.
//
// Color is on by default (so the red is visible in `pm2 logs` / a terminal) and
// honors the NO_COLOR convention. Set NO_COLOR=1 to disable.

const useColor = !process.env.NO_COLOR;
const wrap = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));

export const red = (s) => wrap("31;1", s); // bold red
export const yellow = (s) => wrap("33;1", s); // bold yellow
export const green = (s) => wrap("32", s);
export const dim = (s) => wrap("2", s);

/**
 * Print a red error line: "✖ <context>: <message>". Optional dim detail tail.
 * Example: logError("GROQ LLM", "rate limit hit (429) — daily token limit reached.")
 */
export function logError(context, message, detail) {
  const tail = detail ? dim(`  [${detail}]`) : "";
  console.error(red(`✖ ${context}: ${message}`) + tail);
}

/** Print a yellow warning line. */
export function logWarn(context, message) {
  console.error(yellow(`⚠ ${context}: ${message}`));
}

/** Print a green success/info line. */
export function logOk(message) {
  console.log(green(`✓ ${message}`));
}
