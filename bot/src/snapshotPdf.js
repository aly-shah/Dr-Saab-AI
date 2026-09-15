// Executive Health Snapshot — PDF renderer.
//
// Pure vector output via pdfkit (no browser, no native image libs), so it
// runs the same on this Windows dev box and on the Linux VPS under pm2.
// Layout is a single tall page that mirrors the approved design: header,
// generated/prepared strip, patient profile + latest glucose results,
// weekly/monthly trend charts with AI summaries, other labs, medicines,
// lifestyle, the DrSaab Health Score donut, key insights, and a footer.
//
// Input: the object from assembleSnapshotData() plus the insights object
// ({ weekly_summary, monthly_summary, score_message, insights[] }) from
// snapshotInsights() or fallbackInsights(). Returns a Buffer.

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fmtDate, fmtMonth } from "./snapshotData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const LOGO_MARK = path.join(__dirname, "..", "..", "public", "logo-mark.png");

// ---- palette ---------------------------------------------------------------
const C = {
  navy: "#0B2A6F",
  blue: "#1F5EEA",
  blueDark: "#173F9E",
  teal: "#0FA3B1",
  text: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  cardBorder: "#DCE5F3",
  panel: "#F5F8FE",
  panelBorder: "#E4EBF7",
  green: "#16A34A",
  greenBg: "#E8F7EE",
  amber: "#F59E0B",
  amberBg: "#FFF4DE",
  red: "#DC2626",
  redBg: "#FDECEC",
  purple: "#8B5CF6",
  blueBg: "#E9F0FF",
  white: "#FFFFFF",
};

const TONE_COLOR = { good: C.green, warn: C.amber, bad: C.red, muted: C.faint, info: C.blue };
const LEVEL_COLOR = { good: C.green, above: C.amber, high: C.red, low: C.red, unknown: C.faint };

// ---- page geometry ---------------------------------------------------------
const W = 595;
const M = 24; // outer margin
const CW = W - 2 * M; // content width
const GAP = 12;

// ---- fonts -----------------------------------------------------------------
let fontsChecked = false;
let haveInter = false;
function fontFiles() {
  if (!fontsChecked) {
    fontsChecked = true;
    haveInter = ["Inter-Regular.ttf", "Inter-SemiBold.ttf", "Inter-Bold.ttf"].every((f) =>
      fs.existsSync(path.join(FONT_DIR, f))
    );
  }
  return haveInter;
}

function registerFonts(doc) {
  if (fontFiles()) {
    doc.registerFont("R", path.join(FONT_DIR, "Inter-Regular.ttf"));
    doc.registerFont("S", path.join(FONT_DIR, "Inter-SemiBold.ttf"));
    doc.registerFont("B", path.join(FONT_DIR, "Inter-Bold.ttf"));
  } else {
    doc.registerFont("R", "Helvetica");
    doc.registerFont("S", "Helvetica-Bold");
    doc.registerFont("B", "Helvetica-Bold");
  }
}

// Keep text inside what the embedded font can draw. Inter covers Latin,
// Greek and Cyrillic; anything else (Urdu script names, emoji) would render
// as boxes, so drop it. The Helvetica fallback is Latin-1 only.
function safe(s) {
  let out = String(s ?? "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "");
  out = haveInter
    ? out.replace(/[^ -ɏͰ-ϿЀ-ӿ‐-⁄←-↓€ ]/g, "")
    : out.replace(/[^ -ÿ–—‘’“”•…]/g, "");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}
const arrowUp = () => (haveInter ? "↑" : "+");
const arrowDown = () => (haveInter ? "↓" : "-");
const arrowRight = () => (haveInter ? "→" : ">");

// ---- primitives ------------------------------------------------------------
function txt(doc, s, x, y, { font = "R", size = 9, color = C.text, width, align = "left", lineGap = 1, ellipsis = false, height, chars } = {}) {
  doc.font(font).fontSize(size).fillColor(color);
  const opts = { lineGap, align };
  if (chars != null) opts.characterSpacing = chars;
  if (width != null) opts.width = width;
  else opts.lineBreak = false;
  if (height != null) opts.height = height;
  if (ellipsis) opts.ellipsis = true;
  doc.text(safe(s), x, y, opts);
}

function textWidth(doc, s, font, size) {
  return doc.font(font).fontSize(size).widthOfString(safe(s));
}

// Shrink the font until the string fits `maxWidth`.
function fitSize(doc, s, font, size, maxWidth, min = 6) {
  let f = size;
  while (f > min && textWidth(doc, s, font, f) > maxWidth) f -= 0.5;
  return f;
}

function card(doc, x, y, w, h) {
  doc.save();
  doc.roundedRect(x, y, w, h, 10).fillAndStroke(C.white, C.cardBorder);
  doc.restore();
}

function panel(doc, x, y, w, h, fill = C.panel, stroke = C.panelBorder, r = 8) {
  doc.save();
  doc.roundedRect(x, y, w, h, r).fillAndStroke(fill, stroke);
  doc.restore();
}

function dot(doc, cx, cy, r, color) {
  doc.circle(cx, cy, r).fill(color);
}

function sectionHeader(doc, x, y, n, title, subtitle, maxW = 400) {
  doc.circle(x + 10, y + 10, 9).fill(C.blue);
  txt(doc, String(n), x + 4, y + 5.2, { font: "B", size: 9, color: C.white, width: 12, align: "center" });
  const subW = subtitle ? textWidth(doc, subtitle, "R", 8) + 5 : 0;
  const size = fitSize(doc, title, "B", 11.5, maxW - 26 - subW, 8.5);
  txt(doc, title, x + 26, y + 3.5 + (11.5 - size) / 2, { font: "B", size, color: C.navy });
  if (subtitle) {
    const tw = textWidth(doc, title, "B", size);
    txt(doc, subtitle, x + 26 + tw + 5, y + 5.5, { font: "R", size: 8, color: C.muted });
  }
}

// ---- icons (all drawn, no glyph fonts needed) ------------------------------
function droplet(doc, cx, cy, s, color) {
  const p = `M ${cx} ${cy - s} C ${cx + s * 0.55} ${cy - s * 0.3} ${cx + s * 0.75} ${cy + s * 0.15} ${cx + s * 0.75} ${cy + s * 0.4} ` +
    `A ${s * 0.75} ${s * 0.75} 0 1 1 ${cx - s * 0.75} ${cy + s * 0.4} ` +
    `C ${cx - s * 0.75} ${cy + s * 0.15} ${cx - s * 0.55} ${cy - s * 0.3} ${cx} ${cy - s} Z`;
  doc.path(p).fill(color);
}

function person(doc, cx, cy, s, color) {
  doc.circle(cx, cy - s * 0.42, s * 0.3).fill(color);
  const r = s * 0.62;
  doc.path(`M ${cx - r} ${cy + s * 0.72} A ${r} ${r} 0 0 1 ${cx + r} ${cy + s * 0.72} Z`).fill(color);
}

function calendar(doc, x, y, s, color) {
  doc.save().lineWidth(1.4).strokeColor(color);
  doc.roundedRect(x, y + s * 0.15, s, s * 0.85, 2).stroke();
  doc.moveTo(x, y + s * 0.4).lineTo(x + s, y + s * 0.4).stroke();
  doc.moveTo(x + s * 0.28, y).lineTo(x + s * 0.28, y + s * 0.28).stroke();
  doc.moveTo(x + s * 0.72, y).lineTo(x + s * 0.72, y + s * 0.28).stroke();
  doc.restore();
  for (const [dx, dy] of [[0.3, 0.6], [0.5, 0.6], [0.7, 0.6], [0.3, 0.78], [0.5, 0.78]]) {
    doc.circle(x + s * dx, y + s * dy, 0.9).fill(color);
  }
}

function personOutline(doc, cx, cy, s, color) {
  doc.save().lineWidth(1.4).strokeColor(color);
  doc.circle(cx, cy - s * 0.35, s * 0.28).stroke();
  doc.path(`M ${cx - s * 0.6} ${cy + s * 0.7} A ${s * 0.6} ${s * 0.6} 0 0 1 ${cx + s * 0.6} ${cy + s * 0.7}`).stroke();
  doc.restore();
}

function shield(doc, cx, cy, s, color) {
  const p = `M ${cx} ${cy - s} L ${cx + s * 0.85} ${cy - s * 0.68} L ${cx + s * 0.85} ${cy + s * 0.05} ` +
    `Q ${cx + s * 0.85} ${cy + s * 0.7} ${cx} ${cy + s} Q ${cx - s * 0.85} ${cy + s * 0.7} ${cx - s * 0.85} ${cy + s * 0.05} ` +
    `L ${cx - s * 0.85} ${cy - s * 0.68} Z`;
  doc.path(p).fill(color);
}

function check(doc, cx, cy, s, color, lw = 1.8) {
  doc.save().lineWidth(lw).strokeColor(color).lineCap("round").lineJoin("round");
  doc.moveTo(cx - s * 0.55, cy).lineTo(cx - s * 0.15, cy + s * 0.42).lineTo(cx + s * 0.6, cy - s * 0.42).stroke();
  doc.restore();
}

function sparkle(doc, cx, cy, s, color) {
  const p = `M ${cx} ${cy - s} Q ${cx + s * 0.18} ${cy - s * 0.18} ${cx + s} ${cy} Q ${cx + s * 0.18} ${cy + s * 0.18} ${cx} ${cy + s} ` +
    `Q ${cx - s * 0.18} ${cy + s * 0.18} ${cx - s} ${cy} Q ${cx - s * 0.18} ${cy - s * 0.18} ${cx} ${cy - s} Z`;
  doc.path(p).fill(color);
}

function pill(doc, cx, cy, s, color) {
  doc.save();
  doc.translate(cx, cy).rotate(-40);
  doc.lineWidth(1.4).strokeColor(color);
  doc.roundedRect(-s, -s * 0.42, 2 * s, s * 0.84, s * 0.42).stroke();
  doc.moveTo(0, -s * 0.42).lineTo(0, s * 0.42).stroke();
  doc.restore();
}

function footprint(doc, cx, cy, s, color) {
  doc.save();
  doc.translate(cx, cy).rotate(-15);
  doc.ellipse(0, s * 0.25, s * 0.42, s * 0.62).fill(color);
  for (let i = 0; i < 4; i++) {
    doc.circle(-s * 0.42 + i * s * 0.3, -s * 0.72 + (i === 0 ? 0.1 : i === 3 ? 0.18 : 0) * s, s * 0.13).fill(color);
  }
  doc.restore();
}

function scaleIcon(doc, cx, cy, s, color) {
  doc.save().lineWidth(1.4).strokeColor(color);
  doc.roundedRect(cx - s * 0.75, cy - s * 0.75, s * 1.5, s * 1.5, s * 0.25).stroke();
  doc.path(`M ${cx - s * 0.42} ${cy - s * 0.15} A ${s * 0.45} ${s * 0.45} 0 0 1 ${cx + s * 0.42} ${cy - s * 0.15}`).stroke();
  doc.moveTo(cx, cy - s * 0.15).lineTo(cx + s * 0.18, cy - s * 0.42).stroke();
  doc.restore();
}

function trophy(doc, cx, cy, s, color, filled = false) {
  doc.save();
  const cup = `M ${cx - s * 0.6} ${cy - s * 0.9} L ${cx + s * 0.6} ${cy - s * 0.9} L ${cx + s * 0.6} ${cy - s * 0.2} ` +
    `A ${s * 0.6} ${s * 0.6} 0 0 1 ${cx - s * 0.6} ${cy - s * 0.2} Z`;
  if (filled) {
    doc.path(cup).fill(color);
    doc.rect(cx - s * 0.12, cy + s * 0.35, s * 0.24, s * 0.3).fill(color);
    doc.roundedRect(cx - s * 0.45, cy + s * 0.65, s * 0.9, s * 0.22, 1).fill(color);
    doc.lineWidth(1.2).strokeColor(color);
    doc.path(`M ${cx - s * 0.6} ${cy - s * 0.7} Q ${cx - s * 1.05} ${cy - s * 0.6} ${cx - s * 0.7} ${cy - s * 0.1}`).stroke();
    doc.path(`M ${cx + s * 0.6} ${cy - s * 0.7} Q ${cx + s * 1.05} ${cy - s * 0.6} ${cx + s * 0.7} ${cy - s * 0.1}`).stroke();
  } else {
    doc.lineWidth(1.3).strokeColor(color);
    doc.path(cup).stroke();
    doc.moveTo(cx, cy + s * 0.4).lineTo(cx, cy + s * 0.7).stroke();
    doc.moveTo(cx - s * 0.4, cy + s * 0.75).lineTo(cx + s * 0.4, cy + s * 0.75).stroke();
  }
  doc.restore();
}

function globe(doc, cx, cy, s, color) {
  doc.save().lineWidth(1.2).strokeColor(color);
  doc.circle(cx, cy, s).stroke();
  doc.ellipse(cx, cy, s * 0.42, s).stroke();
  doc.moveTo(cx - s, cy).lineTo(cx + s, cy).stroke();
  doc.restore();
}

function infoIcon(doc, cx, cy, r, color, bg = C.white) {
  doc.circle(cx, cy, r).fill(bg);
  doc.save().lineWidth(1).strokeColor(color).circle(cx, cy, r - 0.5).stroke().restore();
  txt(doc, "i", cx - 4, cy - r * 0.78, { font: "B", size: r * 1.35, color, width: 8, align: "center" });
}

function toneBadge(doc, cx, cy, tone) {
  const r = 9;
  if (tone === "good") {
    doc.circle(cx, cy, r).fill(C.green);
    check(doc, cx, cy, 7, C.white, 2);
  } else if (tone === "warn") {
    doc.circle(cx, cy, r).fill(C.amber);
    doc.path(`M ${cx} ${cy - 5.5} L ${cx + 5.5} ${cy + 4} L ${cx - 5.5} ${cy + 4} Z`).fill(C.white);
    doc.rect(cx - 0.8, cy - 1.5, 1.6, 3).fill(C.amber);
    doc.circle(cx, cy + 2.8, 0.8).fill(C.amber);
  } else {
    doc.circle(cx, cy, r).fill(C.blue);
    txt(doc, "i", cx - 4, cy - 6.5, { font: "B", size: 11, color: C.white, width: 8, align: "center" });
  }
}

// ---- charts ----------------------------------------------------------------
function niceScale(values) {
  if (!values.length) return { lo: 0, hi: 300, step: 100 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  let lo = Math.max(0, Math.floor((min - 20) / 50) * 50);
  let hi = Math.ceil((max + 20) / 50) * 50;
  if (hi - lo < 100) hi = lo + 100;
  const step = (hi - lo) / 4;
  return { lo, hi, step };
}

function lineChart(doc, { x, y, w, h, series, fields, xLabels, emptyText }) {
  const padL = 22;
  const padB = 4;
  const px = x + padL;
  const pw = w - padL;
  const ph = h - padB;
  const all = [];
  for (const d of series) for (const f of fields) if (d[f.key] != null) all.push(d[f.key]);
  const { lo, hi } = niceScale(all);
  const yOf = (v) => y + ph - ((v - lo) / (hi - lo)) * ph;
  const n = series.length;
  const xOf = (i) => px + (n > 1 ? (i / (n - 1)) * pw : pw / 2);

  // grid + y labels
  doc.save();
  for (let g = 0; g <= 4; g++) {
    const v = lo + ((hi - lo) / 4) * g;
    const gy = yOf(v);
    doc.lineWidth(0.6).strokeColor(g === 0 ? C.line : "#EDF2F9");
    doc.moveTo(px, gy).lineTo(px + pw, gy).stroke();
    txt(doc, String(Math.round(v)), x, gy - 3.5, { font: "R", size: 6.5, color: C.muted, width: padL - 4, align: "right" });
  }
  doc.restore();

  if (!all.length) {
    txt(doc, emptyText, px, y + ph / 2 - 10, { font: "S", size: 8.5, color: C.faint, width: pw, align: "center" });
    txt(doc, "Keep logging fasting and random readings to unlock this chart.", px, y + ph / 2 + 3, {
      font: "R", size: 7, color: C.faint, width: pw, align: "center",
    });
  } else {
    for (const f of fields) {
      const pts = [];
      series.forEach((d, i) => {
        if (d[f.key] != null) pts.push([xOf(i), yOf(d[f.key])]);
      });
      if (pts.length > 1) {
        doc.save().lineWidth(1.6).strokeColor(f.color).lineJoin("round").lineCap("round");
        doc.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
        doc.stroke().restore();
      }
      for (const [cx, cy] of pts) {
        doc.circle(cx, cy, 2.3).fill(f.color);
        doc.save().lineWidth(0.8).strokeColor(C.white).circle(cx, cy, 2.3).stroke().restore();
      }
    }
  }

  // x labels
  for (const lbl of xLabels) {
    const lx = xOf(lbl.index);
    txt(doc, lbl.text, lx - 20, y + h + 3, { font: "R", size: 6.2, color: C.muted, width: 40, align: "center" });
  }
}

function weeklyLabels(series) {
  const out = [];
  series.forEach((d, i) => {
    if (i % 2 === 0 || i === series.length - 1) {
      out.push({ index: i, text: fmtDate(d.date, false) });
    }
  });
  // avoid two labels crowding at the tail
  if (out.length >= 2 && out[out.length - 1].index - out[out.length - 2].index < 2) out.splice(out.length - 2, 1);
  return out;
}

function monthlyLabels(series) {
  const out = [];
  let lastMonth = null;
  series.forEach((d, i) => {
    const key = d.key.slice(0, 7);
    if (key !== lastMonth) {
      lastMonth = key;
      if (i > 3 || i === 0) {
        out.push({ index: i, text: fmtMonth(d.date) });
      }
    }
  });
  return out;
}

function donut(doc, cx, cy, r, pct, lw) {
  doc.save().lineWidth(lw).lineCap("round");
  doc.strokeColor("#E6EDF7").circle(cx, cy, r).stroke();
  const p = Math.max(0.01, Math.min(0.999, pct));
  const ang = p * Math.PI * 2;
  const ex = cx + r * Math.sin(ang);
  const ey = cy - r * Math.cos(ang);
  const grad = doc.linearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.stop(0, C.blue).stop(0.55, C.teal).stop(1, C.green);
  doc.strokeColor(grad);
  doc.path(`M ${cx} ${cy - r} A ${r} ${r} 0 ${ang > Math.PI ? 1 : 0} 1 ${ex} ${ey}`).stroke();
  doc.restore();
}

// Logo mark + "DrSaab" wordmark (+ optional tagline). Shared by every report.
function drawBrand(doc, x, y, { size = 40, tagline = null } = {}) {
  if (fs.existsSync(LOGO_MARK)) {
    try {
      doc.image(LOGO_MARK, x, y, { width: size, height: size });
    } catch {
      /* ignore a bad image */
    }
  }
  const fs1 = size * 0.55;
  txt(doc, "Dr", x + size + 6, y + size * 0.2, { font: "B", size: fs1, color: C.navy });
  const drW = textWidth(doc, "Dr", "B", fs1);
  txt(doc, "Saab", x + size + 6 + drW, y + size * 0.2, { font: "B", size: fs1, color: C.teal });
  if (tagline) txt(doc, tagline, x + size + 7, y + size * 0.2 + fs1 + 3, { font: "R", size: 6.5, color: C.blue });
}

// ---- sections --------------------------------------------------------------
function drawHeader(doc, y) {
  // logo
  if (fs.existsSync(LOGO_MARK)) {
    try {
      doc.image(LOGO_MARK, M, y + 2, { width: 40, height: 40 });
    } catch {
      /* ignore a bad image */
    }
  }
  txt(doc, "Dr", M + 46, y + 10, { font: "B", size: 22, color: C.navy });
  const drW = textWidth(doc, "Dr", "B", 22);
  txt(doc, "Saab", M + 46 + drW, y + 10, { font: "B", size: 22, color: C.teal });

  // title block (centred in the space between logo and badge)
  const left = M + 150;
  const right = W - M - 140;
  const cw = right - left;
  const title = "EXECUTIVE HEALTH SNAPSHOT";
  const spacing = 0.4;
  let ts = 19;
  const tw = (f) => doc.font("B").fontSize(f).widthOfString(title, { characterSpacing: spacing });
  while (ts > 12 && tw(ts) > cw - 8) ts -= 0.5;
  txt(doc, title, left + (cw - tw(ts)) / 2, y + 4, { font: "B", size: ts, color: C.navy, chars: spacing });
  const sub = "A Smarter Way to Manage Diabetes";
  const sw = textWidth(doc, sub, "R", 10.5);
  const sx = left + (cw - sw) / 2;
  txt(doc, sub, sx, y + 30, { font: "R", size: 10.5, color: C.blue });
  doc.save().lineWidth(0.8).strokeColor(C.blue);
  const ly = y + 36;
  doc.moveTo(sx - 34, ly).lineTo(sx - 12, ly).stroke();
  doc.moveTo(sx + sw + 12, ly).lineTo(sx + sw + 34, ly).stroke();
  doc.restore();
  sparkle(doc, sx - 8, ly, 3, C.blue);
  sparkle(doc, sx + sw + 8, ly, 3, C.blue);

  // trusted badge
  const bx = W - M - 128;
  doc.circle(bx + 16, y + 22, 16).fill(C.blueBg);
  doc.save().lineWidth(1).strokeColor("#C9D8F6").circle(bx + 16, y + 22, 16).stroke().restore();
  shield(doc, bx + 16, y + 22, 8.5, C.blue);
  check(doc, bx + 16, y + 22.5, 5, C.white, 1.6);
  txt(doc, "Trusted by", bx + 40, y + 11, { font: "R", size: 8.5, color: C.muted });
  txt(doc, "Thousands", bx + 40, y + 23, { font: "B", size: 11, color: C.navy });

  doc.save().lineWidth(0.7).strokeColor(C.line).moveTo(M, y + 52).lineTo(W - M, y + 52).stroke().restore();
}

function drawMeta(doc, y, data) {
  const h = 46;
  panel(doc, M, y, CW, h, "#F7FAFF", C.cardBorder, 9);
  const half = CW / 2;
  calendar(doc, M + 16, y + 14, 16, C.navy);
  txt(doc, "GENERATED ON", M + 44, y + 11, { font: "S", size: 7.5, color: C.muted, chars: 0.6 });
  txt(doc, data.generatedLabel, M + 44, y + 22, { font: "B", size: 12, color: C.text });
  personOutline(doc, M + half + 24, y + 23, 16, C.navy);
  txt(doc, "PREPARED FOR", M + half + 48, y + 11, { font: "S", size: 7.5, color: C.muted, chars: 0.6 });
  const name = data.profile.name;
  txt(doc, name, M + half + 48, y + 22, { font: "B", size: fitSize(doc, name, "B", 12, half - 60), color: C.text });
  return h;
}

function drawProfile(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 1, "PATIENT PROFILE", null, w - 20);
  const ax = x + 46, ay = y + 96;
  doc.circle(ax, ay, 27).fill(C.blueBg);
  doc.save().lineWidth(1).strokeColor("#C9D8F6").circle(ax, ay, 27).stroke().restore();
  person(doc, ax, ay, 22, C.blue);
  const rows = [
    ["Name", p.name],
    ["Age", p.age != null ? `${p.age} years` : "—"],
    ["Gender", p.gender],
    ["Diabetes Type", p.diabetesType],
    ["Height", p.height_cm != null ? `${p.height_cm} cm` : "—"],
    ["Weight", p.weight_kg != null ? `${p.weight_kg} kg` : "—"],
    ["BMI", p.bmi != null ? `${p.bmi}${p.bmiCategory ? " (" + p.bmiCategory + ")" : ""}` : "—"],
  ];
  const lx = x + 92, vx = x + 158, vw = x + w - 12 - (x + 158);
  let ry = y + 44;
  for (const [k, v] of rows) {
    txt(doc, k, lx, ry, { font: "R", size: 8.8, color: C.muted });
    txt(doc, v, vx, ry, { font: "S", size: fitSize(doc, v, "S", 9, vw), color: C.text, width: vw, ellipsis: true, height: 12 });
    ry += 17.5;
  }
}

function drawGlucoseResults(doc, x, y, w, h, latest) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 2, "LATEST GLUCOSE RESULTS", null, w - 20);
  const tx = x + 12, tw = w - 24;
  const cols = [
    { key: "test", label: "Test", w: 0.25, align: "left" },
    { key: "value", label: "Latest Reading", w: 0.22, align: "center" },
    { key: "date", label: "Date", w: 0.21, align: "center" },
    { key: "time", label: "Time", w: 0.12, align: "center" },
    { key: "status", label: "Status", w: 0.2, align: "left" },
  ];
  let ty = y + 42;
  doc.roundedRect(tx, ty, tw, 18, 4).fill("#EEF3FB");
  let cx = tx;
  for (const c of cols) {
    const cw = tw * c.w;
    txt(doc, c.label, cx + (c.align === "left" ? 8 : 0), ty + 5, { font: "S", size: 7.5, color: C.muted, width: cw - (c.align === "left" ? 8 : 0), align: c.align });
    cx += cw;
  }
  ty += 18;
  const rows = [
    { label: "Fasting", icon: (ix, iy) => droplet(doc, ix, iy, 5, C.blue), r: latest.fasting },
    { label: "Random", icon: (ix, iy) => droplet(doc, ix, iy, 5, C.purple), r: latest.random },
    { label: "HbA1c", icon: (ix, iy) => { droplet(doc, ix, iy, 5, C.teal); txt(doc, "%", ix - 3, iy - 1.5, { font: "B", size: 5, color: C.white, width: 6, align: "center" }); }, r: latest.hba1c },
  ];
  const rh = 29;
  for (const row of rows) {
    doc.save().lineWidth(0.6).strokeColor(C.line).moveTo(tx, ty + rh).lineTo(tx + tw, ty + rh).stroke().restore();
    cx = tx;
    const r = row.r;
    const cells = [
      null,
      r ? `${r.value} ${r.unit}` : "—",
      r ? r.date : "Not recorded",
      r ? r.time : "—",
      null,
    ];
    cols.forEach((c, i) => {
      const cw = tw * c.w;
      if (i === 0) {
        row.icon(cx + 12, ty + rh / 2);
        txt(doc, row.label, cx + 22, ty + rh / 2 - 5, { font: "S", size: 8.8, color: C.text });
      } else if (i === 4) {
        const color = r ? LEVEL_COLOR[r.level] || C.faint : C.faint;
        dot(doc, cx + 6, ty + rh / 2, 3.2, color);
        const lbl = r ? r.label : "No data";
        txt(doc, lbl, cx + 13, ty + rh / 2 - 5, { font: "R", size: fitSize(doc, lbl, "R", 7.8, cw - 16, 6.5), color: r ? C.text : C.faint });
      } else {
        const bold = i === 1;
        const val = cells[i];
        const sz = fitSize(doc, val, bold ? "B" : "R", bold ? 9 : 8, cw - 4);
        txt(doc, val, cx + 2, ty + rh / 2 - 5, { font: bold ? "B" : "R", size: sz, color: r ? C.text : C.faint, width: cw - 4, align: "center" });
      }
      cx += cw;
    });
    ty += rh;
  }
  // legend
  const ly = y + h - 16;
  let lx = tx + 6;
  for (const [color, label] of [[C.green, "Good (In Target)"], [C.amber, "Above Target"], [C.red, "High / Low (Needs Attention)"]]) {
    dot(doc, lx + 3, ly + 3.5, 3.2, color);
    txt(doc, label, lx + 10, ly, { font: "R", size: 7.5, color: C.text });
    lx += textWidth(doc, label, "R", 7.5) + 24;
  }
}

function drawTrends(doc, y, h, data, ins) {
  card(doc, M, y, CW, h);
  sectionHeader(doc, M + 12, y + 12, 3, "GLUCOSE TRENDS");
  const innerX = M + 14;
  const colW = (CW - 28 - 18) / 2;
  const panels = [
    { x: innerX, title: "WEEKLY TREND", sub: "(Last 14 Days)", t: data.trends.weekly, labels: weeklyLabels, summary: ins.weekly_summary, empty: "Not enough readings yet" },
    { x: innerX + colW + 18, title: "MONTHLY TREND", sub: "(Last 90 Days)", t: data.trends.monthly, labels: monthlyLabels, summary: ins.monthly_summary, empty: "Not enough readings yet" },
  ];
  for (const p of panels) {
    let py = y + 42;
    txt(doc, p.title, p.x, py, { font: "B", size: 9.5, color: C.text });
    txt(doc, p.sub, p.x + textWidth(doc, p.title, "B", 9.5) + 4, py + 1, { font: "R", size: 8, color: C.muted });
    py += 16;
    dot(doc, p.x + 4, py + 4, 3.2, C.blue);
    txt(doc, "Fasting (mg/dL)", p.x + 11, py, { font: "R", size: 7.5, color: C.text });
    dot(doc, p.x + 92, py + 4, 3.2, C.purple);
    txt(doc, "Random (mg/dL)", p.x + 99, py, { font: "R", size: 7.5, color: C.text });
    py += 16;
    const chartH = 86;
    lineChart(doc, {
      x: p.x, y: py, w: colW, h: chartH,
      series: p.t.series,
      fields: [{ key: "fasting", color: C.blue }, { key: "random", color: C.purple }],
      xLabels: p.labels(p.t.series),
      emptyText: p.empty,
    });
    py += chartH + 16;
    // AI summary box
    const boxH = 66;
    panel(doc, p.x, py, colW, boxH, "#F3F7FF", "#E1E9F8", 8);
    doc.circle(p.x + 20, py + boxH / 2, 12).fill(C.white);
    doc.save().lineWidth(0.8).strokeColor("#D6E1F5").circle(p.x + 20, py + boxH / 2, 12).stroke().restore();
    sparkle(doc, p.x + 20, py + boxH / 2, 6.5, C.blue);
    sparkle(doc, p.x + 26.5, py + boxH / 2 - 6.5, 2.2, C.teal);
    txt(doc, "AI SUMMARY", p.x + 40, py + 8, { font: "B", size: 7.5, color: C.navy, chars: 0.5 });
    const sw = colW - 50;
    let sz = 7.6;
    while (sz > 6.4 && doc.font("R").fontSize(sz).heightOfString(safe(p.summary), { width: sw, lineGap: 1 }) > boxH - 24) sz -= 0.2;
    txt(doc, p.summary, p.x + 40, py + 19, { font: "R", size: sz, color: C.text, width: sw, height: boxH - 22, ellipsis: true, lineGap: 1 });
  }
  // rule line
  const ny = y + h - 18;
  doc.save().lineWidth(0.6).strokeColor(C.line).moveTo(M + 12, ny - 8).lineTo(M + CW - 12, ny - 8).stroke().restore();
  infoIcon(doc, M + 22, ny + 4, 4.5, C.muted);
  const parts = [
    ["R", "Trends are generated when enough data is available."],
    ["S", "Weekly:"], ["R", " at least 3 fasting & 3 random readings in 14 days"],
    ["S", "Monthly:"], ["R", " at least 8 readings in 90 days (3+ fasting, 3+ random)"],
  ];
  const avail = M + CW - 14 - (M + 32) - 28;
  let fs = 6.9;
  const widthAt = (f) => parts.reduce((a, [font, s]) => a + textWidth(doc, s, font, f), 0);
  while (fs > 5.6 && widthAt(fs) > avail) fs -= 0.2;
  let nx = M + 32;
  parts.forEach(([font, s], i) => {
    if (i === 1 || i === 3) {
      doc.save().lineWidth(0.6).strokeColor(C.line).moveTo(nx + 6, ny - 1).lineTo(nx + 6, ny + 9).stroke().restore();
      nx += 14;
    }
    txt(doc, s, nx, ny, { font, size: fs, color: C.muted });
    nx += textWidth(doc, s, font, fs);
  });
}

function drawLabs(doc, x, y, w, h, labs) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 4, "OTHER LAB RESULTS", "(Latest Available)", w - 20);
  let ry = y + 42;
  const items = labs.items;
  if (!items.length) {
    txt(doc, "No lab results on record yet.", x + 14, ry + 8, { font: "S", size: 8.5, color: C.faint, width: w - 28 });
    txt(doc, "Send a photo or PDF of your latest report through Explain My Report and the values will appear here automatically.", x + 14, ry + 22, {
      font: "R", size: 7.6, color: C.faint, width: w - 28, lineGap: 1.5,
    });
    return;
  }
  const rh = 17;
  const nameW = w * 0.37, valW = w * 0.3;
  for (const l of items) {
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(x + 12, ry + rh).lineTo(x + w - 12, ry + rh).stroke().restore();
    txt(doc, l.name, x + 14, ry + 4, { font: "S", size: fitSize(doc, l.name, "S", 8.3, nameW - 6), color: C.text, width: nameW - 6, ellipsis: true, height: 11 });
    txt(doc, l.value, x + 14 + nameW, ry + 4, { font: "R", size: fitSize(doc, l.value, "R", 8, valW - 6), color: C.text, width: valW - 6, ellipsis: true, height: 11 });
    const sx = x + 14 + nameW + valW;
    dot(doc, sx + 3, ry + 8.5, 3, TONE_COLOR[l.tone] || C.faint);
    const stW = x + w - 12 - (sx + 10);
    txt(doc, l.label, sx + 10, ry + 4, { font: l.tone === "muted" ? "R" : "S", size: fitSize(doc, l.label, "S", 7.6, stW, 6), color: TONE_COLOR[l.tone] === C.faint ? C.faint : l.tone === "good" ? C.text : TONE_COLOR[l.tone] });
    ry += rh;
  }
  txt(doc, `Showing latest ${items.length} result${items.length === 1 ? "" : "s"}`, x + 14, y + h - 16, { font: "R", size: 7.4, color: C.blue });
}

function drawMedicines(doc, x, y, w, h, meds) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 5, "CURRENT MEDICINES", null, w - 20);
  let my = y + 44;
  if (!meds.length) {
    txt(doc, "No medicines on record.", x + 14, my + 6, { font: "S", size: 8.5, color: C.faint, width: w - 28 });
    txt(doc, "Tell DrSaab your medicines under My Health and they will be listed here.", x + 14, my + 20, { font: "R", size: 7.6, color: C.faint, width: w - 28, lineGap: 1.5 });
  }
  for (const m of meds) {
    dot(doc, x + 18, my + 5, 2.3, C.blue);
    const line1 = [m.name, m.dose].filter(Boolean).join(" ");
    txt(doc, line1, x + 26, my, { font: "S", size: fitSize(doc, line1, "S", 8.6, w - 40), color: C.text, width: w - 40, ellipsis: true, height: 11 });
    if (m.frequency) txt(doc, m.frequency, x + 26, my + 11, { font: "R", size: 7.4, color: C.muted, width: w - 40, ellipsis: true, height: 10 });
    my += m.frequency ? 24 : 15;
  }
  const foot = "Always follow your doctor's advice";
  txt(doc, foot, x + 12, y + h - 16, { font: "R", size: fitSize(doc, foot, "R", 7.4, w - 24, 6), color: C.blue, width: w - 24, align: "center" });
}

function drawLifestyle(doc, x, y, w, h, ls) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 6, "LIFESTYLE & ACTIVITY", null, w - 20);
  let ty = y + 42;
  const deltaW = 66;
  const tile = (color, glyph, label, big, unit, deltaText, deltaColor, deltaSub) => {
    doc.roundedRect(x + 14, ty, 32, 32, 8).fill(color);
    glyph(x + 30, ty + 16);
    txt(doc, label, x + 54, ty + 2, { font: "R", size: 8, color: C.muted });
    txt(doc, big, x + 54, ty + 12, { font: "B", size: 17, color: C.text });
    if (unit) txt(doc, unit, x + 54 + textWidth(doc, big, "B", 17) + 3, ty + 20, { font: "R", size: 7.5, color: C.muted });
    if (deltaText) {
      const dx = x + w - 14 - deltaW;
      txt(doc, deltaText, dx, deltaSub ? ty + 9 : ty + 14, { font: "B", size: 9.5, color: deltaColor, width: deltaW, align: "right" });
      if (deltaSub) txt(doc, deltaSub, dx, ty + 22, { font: "R", size: 6.8, color: C.muted, width: deltaW, align: "right" });
    }
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(x + 14, ty + 40).lineTo(x + w - 14, ty + 40).stroke().restore();
    ty += 44;
  };
  const pct = ls.checkinsPct;
  const pctText = pct == null ? "" : `${pct >= 0 ? arrowUp() : arrowDown()} ${Math.abs(pct)}%`;
  tile(C.green, (cx, cy) => check(doc, cx, cy, 9, C.white, 2.2), "Check-ins (last 30 days)", String(ls.checkins), "", pctText, pct == null || pct >= 0 ? C.green : C.amber, pctText ? "vs last month" : "");
  const wd = ls.weightDelta;
  const wdText = wd == null ? "" : wd === 0 ? "no change" : `${wd < 0 ? arrowDown() : arrowUp()} ${Math.abs(wd)} kg`;
  tile(C.blue, (cx, cy) => scaleIcon(doc, cx, cy, 9, C.white), "Weight (Latest)", ls.weightLatest != null ? String(ls.weightLatest) : "—", ls.weightLatest != null ? "kg" : "", wdText, wd != null && wd <= 0 ? C.green : C.amber, wdText ? "vs last month" : "");
  tile(C.purple, (cx, cy) => trophy(doc, cx, cy + 1, 8, C.white, true), "Active Challenges", String(ls.activeChallenges), "", `View all ${arrowRight()}`, C.blue, "");
  // chips
  const chips = ls.challengeNames.length ? ls.challengeNames : ["No active challenge — join one from the menu"];
  let cxp = x + 14;
  const cy = y + h - 26;
  for (const name of chips) {
    const label = name;
    const full = textWidth(doc, label, "S", 7.4) + 26;
    const tw = Math.min(full, x + w - 14 - cxp);
    if (tw < 40 || tw < full * 0.6) break;
    doc.roundedRect(cxp, cy, tw, 18, 9).fillAndStroke("#F7FAFF", C.cardBorder);
    if (ls.challengeNames.length) {
      doc.circle(cxp + 11, cy + 9, 5).fill(C.greenBg);
      check(doc, cxp + 11, cy + 9, 4, C.green, 1.3);
    } else {
      infoIcon(doc, cxp + 11, cy + 9, 4.5, C.faint);
    }
    txt(doc, label, cxp + 20, cy + 5, { font: "S", size: 7.4, color: C.text, width: tw - 24, ellipsis: true, height: 10 });
    cxp += tw + 6;
  }
}

function drawScore(doc, x, y, w, h, score, message) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 7, "DRSAAB HEALTH SCORE", null, w - 20);
  const cx = x + 62, cy = y + 84, r = 33;
  donut(doc, cx, cy, r, score.total / 100, 10);
  txt(doc, String(score.total), cx - 30, cy - 15, { font: "B", size: 22, color: C.text, width: 60, align: "center" });
  txt(doc, "/100", cx - 30, cy + 9, { font: "R", size: 7.5, color: C.muted, width: 60, align: "center" });
  const ratingColor = { Excellent: C.green, Good: C.green, Fair: C.amber, "Needs Focus": C.red }[score.rating] || C.green;
  const rx = x + 112;
  txt(doc, score.rating, rx, y + 44, { font: "B", size: 17, color: ratingColor });
  const rw = textWidth(doc, score.rating, "B", 17);
  sparkle(doc, rx + rw + 10, y + 52, 5, ratingColor);
  txt(doc, message, rx, y + 66, { font: "R", size: 7.8, color: C.text, width: x + w - 12 - rx, height: 40, ellipsis: true, lineGap: 1.3 });
  // components
  const icons = {
    glucose: (ix, iy) => droplet(doc, ix, iy, 5.5, C.blue),
    medication: (ix, iy) => pill(doc, ix, iy, 5.5, C.blue),
    activity: (ix, iy) => footprint(doc, ix, iy, 5.5, C.blue),
    weight: (ix, iy) => scaleIcon(doc, ix, iy, 5.5, C.blue),
    challenge: (ix, iy) => trophy(doc, ix, iy, 6, C.blue, false),
  };
  const compY = y + h - 52;
  const n = score.components.length;
  const cw = (w - 24) / n;
  score.components.forEach((c, i) => {
    const ccx = x + 12 + cw * i + cw / 2;
    icons[c.key]?.(ccx, compY + 4);
    txt(doc, c.label, ccx - cw / 2, compY + 15, { font: "R", size: 6.4, color: C.muted, width: cw, align: "center", lineGap: 0.5 });
    txt(doc, `${c.score}/${c.max}`, ccx - cw / 2, compY + 35, { font: "B", size: 9, color: C.text, width: cw, align: "center" });
    if (i < n - 1) doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(x + 12 + cw * (i + 1), compY).lineTo(x + 12 + cw * (i + 1), compY + 46).stroke().restore();
  });
}

function drawInsights(doc, x, y, w, h, insights) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 8, "KEY INSIGHTS", null, w - 20);
  const list = insights.slice(0, 3);
  const bh = 37;
  let by = y + 42;
  for (const ins of list) {
    panel(doc, x + 12, by, w - 24, bh, "#F6F9FF", "#E4EBF7", 8);
    toneBadge(doc, x + 30, by + bh / 2, ins.tone);
    const iw = w - 64;
    let tsz = 8.2;
    while (tsz > 6.6 && doc.font("R").fontSize(tsz).heightOfString(safe(ins.text), { width: iw, lineGap: 1 }) > bh - 10) tsz -= 0.2;
    const th = doc.font("R").fontSize(tsz).heightOfString(safe(ins.text), { width: iw, lineGap: 1 });
    txt(doc, ins.text, x + 48, by + Math.max(5, (bh - th) / 2), { font: "R", size: tsz, color: C.text, width: iw, height: bh - 8, ellipsis: true, lineGap: 1 });
    by += bh + 7;
  }
}

function drawFooter(doc, y, h) {
  doc.save().lineWidth(0.7).strokeColor(C.line).moveTo(M, y - 8).lineTo(W - M, y - 8).stroke().restore();
  if (fs.existsSync(LOGO_MARK)) {
    try {
      doc.image(LOGO_MARK, M, y + 4, { width: 24, height: 24 });
    } catch {
      /* ignore */
    }
  }
  txt(doc, "This snapshot is automatically generated by DrSaab using the information you have recorded.", M + 34, y + 4, { font: "R", size: 7.4, color: C.muted, width: 340 });
  txt(doc, "It is intended to support — not replace — medical advice from your healthcare professional.", M + 34, y + 16, { font: "R", size: 7.4, color: C.muted, width: 340 });
  const site = "www.drsaabcoach.com";
  const sw = textWidth(doc, site, "B", 9);
  globe(doc, W - M - sw - 16, y + 15, 5.5, C.blue);
  txt(doc, site, W - M - sw, y + 10, { font: "B", size: 9, color: C.blue });
}

// ---- entry -----------------------------------------------------------------
export async function renderSnapshotPdf(data, insights) {
  const ins = {
    weekly_summary: insights?.weekly_summary || "",
    monthly_summary: insights?.monthly_summary || "",
    score_message: insights?.score_message || "",
    insights: Array.isArray(insights?.insights) ? insights.insights : [],
  };

  // Section heights (top → bottom). Summing them gives the page height so the
  // whole snapshot is always one page, like the design.
  const H_HEADER = 56, H_META = 46, H_ROW_A = 180, H_TRENDS = 278, H_ROW_B = 200, H_ROW_C = 168, H_FOOTER = 34;
  const total = 20 + H_HEADER + 10 + H_META + GAP + H_ROW_A + GAP + H_TRENDS + GAP + H_ROW_B + GAP + H_ROW_C + 16 + H_FOOTER + 8;

  const doc = new PDFDocument({
    size: [W, total],
    margin: 0,
    info: {
      Title: `DrSaab Executive Health Snapshot — ${safe(data.profile.name)}`,
      Author: "DrSaab AI",
      Subject: "Executive Health Snapshot",
      Creator: "DrSaab",
    },
  });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  registerFonts(doc);
  doc.rect(0, 0, W, total).fill(C.white);

  let y = 20;
  drawHeader(doc, y);
  y += H_HEADER + 10;
  drawMeta(doc, y, data);
  y += H_META + GAP;

  const profW = 236;
  drawProfile(doc, M, y, profW, H_ROW_A, data.profile);
  drawGlucoseResults(doc, M + profW + GAP, y, CW - profW - GAP, H_ROW_A, data.latest);
  y += H_ROW_A + GAP;

  drawTrends(doc, y, H_TRENDS, data, ins);
  y += H_TRENDS + GAP;

  const labsW = 206, medsW = 142;
  const lifeW = CW - labsW - medsW - 2 * GAP;
  drawLabs(doc, M, y, labsW, H_ROW_B, data.labs);
  drawMedicines(doc, M + labsW + GAP, y, medsW, H_ROW_B, data.medicines);
  drawLifestyle(doc, M + labsW + medsW + 2 * GAP, y, lifeW, H_ROW_B, data.lifestyle);
  y += H_ROW_B + GAP;

  const scoreW = 300;
  drawScore(doc, M, y, scoreW, H_ROW_C, data.score, ins.score_message);
  drawInsights(doc, M + scoreW + GAP, y, CW - scoreW - GAP, H_ROW_C, ins.insights);
  y += H_ROW_C + 16;

  drawFooter(doc, y, H_FOOTER);

  doc.end();
  return done;
}

// Shared drawing kit for the doctor-side reports (doctorReportPdf.js) so the
// two report families stay visually identical.
export const kit = {
  C, W, M, CW, GAP, LOGO_MARK,
  registerFonts, safe, txt, textWidth, fitSize,
  card, panel, dot, sectionHeader, drawBrand,
  droplet, person, personOutline, calendar, shield, check, sparkle, pill, footprint, scaleIcon, trophy, globe, infoIcon, toneBadge,
  lineChart, weeklyLabels, donut, niceScale,
  arrowUp, arrowDown, arrowRight,
};
