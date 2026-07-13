// Lightweight helpers for handling attachments in the lab-report flow.
// The vision model can only read images, so PDFs are converted to plain
// text server-side via pdf-parse and then fed through the SAME code path
// as a user who types the values (see labText in flows/labreport.js).

const DATA_URL_RE = /^data:([^;,]+)(?:;base64)?,(.*)$/;

// Parse a data URL into { mime, buffer, base64 }. Returns null if the input
// isn't a data URL. Handles both base64 and unencoded payloads.
export function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) return null;
  const mime = m[1] || "application/octet-stream";
  const isBase64 = /;base64/.test(dataUrl.slice(0, dataUrl.indexOf(",")));
  const payload = m[2] || "";
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buffer, base64: isBase64 ? payload : buffer.toString("base64") };
}

export function isPdfMime(mime) {
  return typeof mime === "string" && mime.toLowerCase().startsWith("application/pdf");
}

export function isImageMime(mime) {
  return typeof mime === "string" && mime.toLowerCase().startsWith("image/");
}

// Extract plain text from a PDF buffer. Returns "" on failure so callers
// can fall through to their "couldn't read the report" branch instead of
// crashing the whole flow. pdf-parse v2 exposes a PDFParse class; older v1
// APIs (default export as a function) are also handled for safety.
export async function extractPdfText(buffer) {
  try {
    const mod = await import("pdf-parse");
    const PDFParse = mod.PDFParse;
    if (PDFParse) {
      const parser = new PDFParse({ data: buffer });
      try {
        const { text } = await parser.getText();
        return (text || "").trim();
      } finally {
        await parser.destroy?.().catch(() => {});
      }
    }
    const legacy = mod.default || mod;
    if (typeof legacy === "function") {
      const { text } = await legacy(buffer);
      return (text || "").trim();
    }
    console.error("pdf-parse: no known export shape");
    return "";
  } catch (e) {
    console.error("pdf-parse failed:", e?.message);
    return "";
  }
}
