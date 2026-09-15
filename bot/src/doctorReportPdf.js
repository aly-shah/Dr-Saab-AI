// Doctor-side PDF reports (pdfkit, shared drawing kit from snapshotPdf.js).
//
//   renderDoctorWeeklyPdf(report)            → "Weekly Patient Snapshots":
//       summary page(s) for all connected patients, then one Patient Health
//       Snapshot page per patient. Page X of N throughout.
//   renderPatientSnapshotPdf(report, index)  → one Patient Health Snapshot
//       page for a single patient (same layout, standalone).
//
// `report` comes from doctorReportData.assembleDoctorReport(). Units are the
// app's (mg/dL, %), statuses use the doctor-facing wording of the approved
// design (In Range / Above Range / Needs Attention).

import PDFDocument from "pdfkit";
import { kit } from "./snapshotPdf.js";
import { fmtDate } from "./snapshotData.js";

const {
  C, W, M, CW, GAP,
  registerFonts, safe, txt, textWidth, fitSize,
  card, panel, dot, sectionHeader, drawBrand,
  droplet, person, personOutline, calendar, shield, check, sparkle, pill, footprint, scaleIcon, trophy, globe, infoIcon,
  lineChart, weeklyLabels,
} = kit;

const TONE_COLOR = { good: C.green, warn: C.amber, bad: C.red, muted: C.faint };
const LEVEL = {
  good: { label: "In Range", color: C.green },
  above: { label: "Above Range", color: C.amber },
  high: { label: "Above Range", color: C.red },
  low: { label: "Below Range", color: C.red },
  unknown: { label: "—", color: C.faint },
};
const LAB_LABEL = { Normal: "In Range", Borderline: "Needs Attention", "Borderline High": "Needs Attention", "Borderline Low": "Needs Attention", High: "Above Range", Low: "Below Range", Abnormal: "Out of Range" };

const PATIENT_PAGE_H = 872;

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------
function footer(doc, y, pageNo, pageTotal, text) {
  doc.save().lineWidth(0.7).strokeColor(C.line).moveTo(M, y - 8).lineTo(W - M, y - 8).stroke().restore();
  doc.circle(M + 11, y + 12, 11).fill(C.blueBg);
  shield(doc, M + 11, y + 12, 7, C.blue);
  check(doc, M + 11, y + 12.5, 4, C.white, 1.4);
  txt(doc, text, M + 30, y + 2, { font: "R", size: 7.2, color: C.muted, width: 330, lineGap: 1.5 });
  const site = "www.drsaabcoach.com";
  const sw = textWidth(doc, site, "B", 8.5);
  txt(doc, `Page ${pageNo} of ${pageTotal}`, W - M - sw, y + 1, { font: "R", size: 7.5, color: C.muted, width: sw, align: "right" });
  globe(doc, W - M - sw - 14, y + 18, 4.8, C.blue);
  txt(doc, site, W - M - sw, y + 13, { font: "B", size: 8.5, color: C.blue });
}

function avatar(doc, cx, cy, r) {
  doc.circle(cx, cy, r).fill(C.blueBg);
  doc.save().lineWidth(0.8).strokeColor("#C9D8F6").circle(cx, cy, r).stroke().restore();
  person(doc, cx, cy, r * 0.82, C.blue);
}

function statusDotLabel(doc, x, y, status, w, size = 7.6) {
  const color = TONE_COLOR[status.tone] || C.faint;
  dot(doc, x + 3, y + 4, 3, color);
  txt(doc, status.label, x + 10, y, { font: "S", size, color: status.tone === "muted" ? C.faint : C.text, width: w - 10, lineGap: 0.5 });
}

// 14-day mini trend, no axes.
function sparkline(doc, x, y, w, h, series) {
  const fields = [{ key: "fasting", color: C.blue }, { key: "random", color: C.purple }];
  const vals = [];
  for (const d of series) for (const f of fields) if (d[f.key] != null) vals.push(d[f.key]);
  if (vals.length < 2) {
    txt(doc, "No readings", x, y + h / 2 - 4, { font: "R", size: 6.5, color: C.faint, width: w, align: "center" });
    return;
  }
  const lo = Math.min(...vals) - 10, hi = Math.max(...vals) + 10;
  const n = series.length;
  const xOf = (i) => x + (n > 1 ? (i / (n - 1)) * w : w / 2);
  const yOf = (v) => y + h - ((v - lo) / (hi - lo || 1)) * h;
  for (const f of fields) {
    const pts = [];
    series.forEach((d, i) => { if (d[f.key] != null) pts.push([xOf(i), yOf(d[f.key])]); });
    if (pts.length > 1) {
      doc.save().lineWidth(1.1).strokeColor(f.color).lineJoin("round");
      doc.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
      doc.stroke().restore();
    }
    for (const [px, py] of pts) doc.circle(px, py, 1.4).fill(f.color);
  }
}

function donutSegments(doc, cx, cy, r, lw, segments) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  doc.save().lineWidth(lw).lineCap("butt");
  if (!total) {
    doc.strokeColor("#E6EDF7").circle(cx, cy, r).stroke();
    doc.restore();
    return;
  }
  let a0 = -Math.PI / 2;
  for (const s of segments) {
    if (!s.value) continue;
    const a1 = a0 + (s.value / total) * Math.PI * 2;
    const sx = cx + r * Math.cos(a0), sy = cy + r * Math.sin(a0);
    const ex = cx + r * Math.cos(a1 - 0.0001), ey = cy + r * Math.sin(a1 - 0.0001);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    doc.strokeColor(s.color).path(`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`).stroke();
    a0 = a1;
  }
  doc.restore();
}

function metaCell(doc, x, y, w, icon, label, value) {
  icon(x + 18, y + 22);
  txt(doc, label, x + 38, y + 10, { font: "S", size: 6.8, color: C.muted, chars: 0.5 });
  txt(doc, value, x + 38, y + 21, { font: "B", size: fitSize(doc, value, "B", 10.5, w - 46, 7), color: C.text });
}

// ---------------------------------------------------------------------------
// Summary page
// ---------------------------------------------------------------------------
const ROWS_PER_PAGE = 8;

function summaryPageHeight(rows, withTail) {
  const table = 30 + 36 + rows * 46 + 22;
  const tail = withTail ? GAP + 118 + GAP + 150 : 0;
  return 20 + 54 + 10 + 46 + 8 + 26 + 10 + table + 24 + tail + 14 + 30 + 10;
}

function drawSummaryHeader(doc, y, report) {
  drawBrand(doc, M, y + 2, { size: 36, tagline: "A Smarter Way to Manage Diabetes" });
  const left = M + 170, right = W - M;
  const title = "WEEKLY PATIENT SNAPSHOTS";
  const ts = fitSize(doc, title, "B", 19, right - left - 4, 12);
  txt(doc, title, left, y + 4, { font: "B", size: ts, color: C.navy, width: right - left, align: "center", chars: 0.3 });
  txt(doc, "Summary of All Connected Patients", left, y + 30, { font: "R", size: 10, color: C.text, width: right - left, align: "center" });
  doc.save().lineWidth(0.7).strokeColor(C.line).moveTo(M, y + 52).lineTo(W - M, y + 52).stroke().restore();
  void report;
}

function drawSummaryMeta(doc, y, report) {
  panel(doc, M, y, CW, 46, "#F7FAFF", C.cardBorder, 9);
  const cw = CW / 3;
  metaCell(doc, M, y, cw, (cx, cy) => calendar(doc, cx - 8, cy - 8, 16, C.navy), "REPORTING PERIOD", report.period.label);
  doc.save().lineWidth(0.6).strokeColor(C.cardBorder).moveTo(M + cw, y + 8).lineTo(M + cw, y + 38).stroke().restore();
  metaCell(doc, M + cw, y, cw, (cx, cy) => personOutline(doc, cx, cy, 15, C.navy), "GENERATED FOR", report.doctor.name);
  doc.save().lineWidth(0.6).strokeColor(C.cardBorder).moveTo(M + 2 * cw, y + 8).lineTo(M + 2 * cw, y + 38).stroke().restore();
  metaCell(doc, M + 2 * cw, y, cw, (cx, cy) => calendar(doc, cx - 8, cy - 8, 16, C.navy), "GENERATED ON", `${report.generatedLabel}  |  ${report.generatedTime}`);
}

function drawBanner(doc, y) {
  panel(doc, M, y, CW, 26, "#EEF3FD", "#D9E4F8", 8);
  infoIcon(doc, M + 16, y + 13, 5.5, C.blue, C.white);
  txt(doc, "This summary provides an overview of the latest information recorded by your connected patients in DrSaab during the reporting period.", M + 28, y + 9, {
    font: "R", size: 7.4, color: C.text, width: CW - 40,
  });
}

const COLS = [
  { key: "patient", label: "Patient", w: 96, align: "left" },
  { key: "profile", label: "Health Profile", w: 56, align: "center" },
  { key: "hba1c", label: "Latest HbA1c", sub: "(Most Recent)", w: 56, align: "center" },
  { key: "fasting", label: "Fasting (mg/dL)", w: 52, align: "center", group: "Latest Glucose (Most Recent)" },
  { key: "random", label: "Random (mg/dL)", w: 52, align: "center", group: "Latest Glucose (Most Recent)" },
  { key: "trend", label: "Trend", sub: "(Last 14 Days)", w: 66, align: "center" },
  { key: "activity", label: "Activity", sub: "Check-ins", w: 36, align: "center" },
  { key: "med", label: "Med Check-ins", sub: "(This Week)", w: 46, align: "center" },
  { key: "status", label: "Status", sub: "(Overall)", w: 63, align: "left" },
];

function drawOverviewTable(doc, y, patients, total, continued) {
  const rowsH = patients.length * 46;
  const h = 30 + 36 + rowsH + 22;
  card(doc, M, y, CW, h);
  txt(doc, `OVERVIEW OF CONNECTED PATIENTS (${total})${continued ? " — continued" : ""}`, M + 14, y + 12, { font: "B", size: 10.5, color: C.navy });
  const tx = M + 12, tw = CW - 24;
  const scale = tw / COLS.reduce((a, c) => a + c.w, 0);
  let ty = y + 30;
  // two-tier header
  doc.roundedRect(tx, ty, tw, 36, 4).fill("#EEF3FB");
  let cx = tx;
  let groupStart = null;
  COLS.forEach((c, i) => {
    const cw = c.w * scale;
    if (c.group && groupStart == null) groupStart = cx;
    const lastOfGroup = c.group && !(COLS[i + 1] && COLS[i + 1].group === c.group);
    if (c.group) {
      if (lastOfGroup) {
        const gw = cx + cw - groupStart;
        txt(doc, c.group, groupStart, ty + 5, { font: "S", size: 6.8, color: C.text, width: gw, align: "center" });
        doc.save().lineWidth(0.5).strokeColor(C.cardBorder).moveTo(groupStart + 4, ty + 17).lineTo(cx + cw - 4, ty + 17).stroke().restore();
        groupStart = null;
      }
      txt(doc, c.label, cx, ty + 21, { font: "S", size: 6.2, color: C.muted, width: cw, align: "center" });
    } else {
      const padL = c.align === "left" ? 8 : 0;
      txt(doc, c.label, cx + padL, ty + (c.sub ? 9 : 14), { font: "S", size: fitSize(doc, c.label, "S", 7, cw - padL - 2, 5.4), color: C.text, width: cw - padL, align: c.align });
      if (c.sub) txt(doc, c.sub, cx + padL, ty + 20, { font: "R", size: fitSize(doc, c.sub, "R", 6, cw - padL - 2, 5), color: C.muted, width: cw - padL, align: c.align });
    }
    cx += cw;
  });
  ty += 36;
  for (const p of patients) {
    const rh = 46;
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(tx, ty + rh).lineTo(tx + tw, ty + rh).stroke().restore();
    cx = tx;
    const mid = ty + rh / 2;
    const s = p.snapshot;
    for (const c of COLS) {
      const cw = c.w * scale;
      switch (c.key) {
        case "patient":
          avatar(doc, cx + 14, mid, 11);
          txt(doc, p.name, cx + 30, mid - 10, { font: "B", size: fitSize(doc, p.name, "B", 8.2, cw - 34, 6.5), color: C.text, width: cw - 34, ellipsis: true, height: 11 });
          txt(doc, `ID: ${p.id}`, cx + 30, mid + 2, { font: "R", size: 6.8, color: C.muted });
          break;
        case "profile":
          txt(doc, p.diabetesType, cx + 2, mid - 8, { font: "R", size: 7, color: C.text, width: cw - 4, align: "center", lineGap: 0.5 });
          break;
        case "hba1c":
          if (s.latest.hba1c) {
            txt(doc, `${s.latest.hba1c.value} %`, cx, mid - 9, { font: "B", size: 8.2, color: C.text, width: cw, align: "center" });
            txt(doc, s.latest.hba1c.date, cx, mid + 3, { font: "R", size: 6.5, color: C.muted, width: cw, align: "center" });
          } else txt(doc, "—", cx, mid - 4, { font: "R", size: 8, color: C.faint, width: cw, align: "center" });
          break;
        case "fasting":
        case "random": {
          const r = s.latest[c.key];
          if (r) {
            txt(doc, String(r.value), cx, mid - 9, { font: "B", size: 8.2, color: C.text, width: cw, align: "center" });
            txt(doc, r.date, cx, mid + 3, { font: "R", size: 6.5, color: C.muted, width: cw, align: "center" });
          } else txt(doc, "—", cx, mid - 4, { font: "R", size: 8, color: C.faint, width: cw, align: "center" });
          break;
        }
        case "trend":
          sparkline(doc, cx + 6, ty + 10, cw - 12, rh - 20, s.trends.weekly.series);
          break;
        case "activity":
          txt(doc, String(p.week.activity), cx, mid - 6, { font: "B", size: 10, color: C.text, width: cw, align: "center" });
          break;
        case "med":
          txt(doc, String(p.week.medication), cx, mid - 6, { font: "B", size: 10, color: C.text, width: cw, align: "center" });
          break;
        case "status": {
          const lines = doc.font("S").fontSize(6.8).heightOfString(safe(p.status.label), { width: cw - 16, lineGap: 0.5 }) / 8.5;
          statusDotLabel(doc, cx + 4, lines > 1.5 ? mid - 9 : mid - 4, p.status, cw - 6, 6.8);
          break;
        }
      }
      cx += cw;
    }
    ty += rh;
  }
  // legend
  const ly = y + h - 15;
  let lx = tx + 4;
  for (const [color, label] of [[C.green, "Good: Most readings in range"], [C.amber, "Needs Attention: Some readings out of range"], [C.red, "Needs Urgent Attention: Many readings out of range"]]) {
    dot(doc, lx + 3, ly + 3.5, 3, color);
    txt(doc, label, lx + 10, ly, { font: "R", size: 6.6, color: C.text });
    lx += textWidth(doc, label, "R", 6.6) + 22;
  }
  return h;
}

function drawWeeklySummary(doc, y, report) {
  const h = 118;
  card(doc, M, y, CW, h);
  txt(doc, "WEEKLY SUMMARY ACROSS ALL PATIENTS", M + 14, y + 12, { font: "B", size: 10.5, color: C.navy });
  const t = report.totals;
  const tiles = [
    { icon: (x, yy) => droplet(doc, x, yy, 7, C.blue), title: "Total Glucose Readings", sub: "(This Week)", big: t.glucose, foot: [`Fasting: ${t.fasting}`, `Random: ${t.random}`] },
    { icon: (x, yy) => pill(doc, x, yy, 7, C.blue), title: "Medication Check-ins", sub: "(This Week)", big: t.medication, foot: [`Patients Active: ${t.medicationActive}/${t.patients}`] },
    { icon: (x, yy) => footprint(doc, x, yy, 7, C.green), title: "Activity Check-ins", sub: "(This Week)", big: t.activity, foot: [`Patients Active: ${t.activityActive}/${t.patients}`] },
    { icon: (x, yy) => scaleIcon(doc, x, yy, 7, C.blue), title: "Weight Entries", sub: "(This Week)", big: t.weight, foot: [`Patients Active: ${t.weightActive}/${t.patients}`] },
    { icon: (x, yy) => { doc.save().lineWidth(1.3).strokeColor(C.blue).roundedRect(x - 5, yy - 7, 10, 14, 1.5).stroke().moveTo(x - 2.5, yy - 2).lineTo(x + 2.5, yy - 2).stroke().moveTo(x - 2.5, yy + 1.5).lineTo(x + 2.5, yy + 1.5).stroke().restore(); }, title: "New Reports Uploaded", sub: "(This Week)", big: t.reports, foot: [`Patients Active: ${t.reportsActive}/${t.patients}`] },
  ];
  const n = tiles.length;
  const gap = 8;
  const tw = (CW - 28 - gap * (n - 1)) / n;
  let x = M + 14;
  for (const tile of tiles) {
    panel(doc, x, y + 30, tw, h - 42, "#F7FAFF", C.panelBorder, 8);
    doc.circle(x + 16, y + 46, 10).fill(C.white);
    doc.save().lineWidth(0.6).strokeColor(C.cardBorder).circle(x + 16, y + 46, 10).stroke().restore();
    tile.icon(x + 16, y + 46);
    txt(doc, tile.title, x + 30, y + 38, { font: "S", size: fitSize(doc, tile.title, "S", 7, tw - 34, 5.8), color: C.text });
    txt(doc, tile.sub, x + 30, y + 48, { font: "R", size: 6.2, color: C.muted });
    txt(doc, String(tile.big), x + 10, y + 62, { font: "B", size: 17, color: C.text });
    let fy = y + 84;
    for (const f of tile.foot) {
      const [k, v] = f.split(": ");
      txt(doc, `${k}:`, x + 10, fy, { font: "R", size: 6.5, color: C.muted });
      txt(doc, v, x + 10 + textWidth(doc, `${k}:`, "R", 6.5) + 3, fy, { font: "S", size: 6.5, color: C.text });
      fy += 9;
    }
    x += tw + gap;
  }
  return h;
}

function drawBreakdownAndNotes(doc, y, report) {
  const h = 150;
  const leftW = 250;
  card(doc, M, y, leftW, h);
  txt(doc, "PATIENT STATUS BREAKDOWN", M + 14, y + 12, { font: "B", size: 10.5, color: C.navy });
  const b = report.breakdown;
  const total = report.patients.length || 0;
  donutSegments(doc, M + 50, y + 92, 28, 14, [
    { value: b.good, color: C.green },
    { value: b.warn, color: C.amber },
    { value: b.urgent, color: C.red },
    { value: b.none, color: "#CBD5E1" },
  ]);
  let ly = y + 52;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  for (const [color, label, n] of [[C.green, "Good", b.good], [C.amber, "Needs Attention", b.warn], [C.red, "Needs Urgent Attention", b.urgent], ["#CBD5E1", "No recent readings", b.none]]) {
    if (label === "No recent readings" && !n) continue;
    dot(doc, M + 96, ly + 4, 3.2, color);
    txt(doc, label, M + 104, ly, { font: "R", size: 7.4, color: C.text });
    txt(doc, `${n} (${pct(n)}%)`, M + leftW - 14 - 44, ly, { font: "S", size: 7.6, color: C.text, width: 44, align: "right" });
    ly += 22;
  }

  const nx = M + leftW + GAP, nw = CW - leftW - GAP;
  panel(doc, nx, y, nw, h, "#EEF3FD", "#D9E4F8", 10);
  doc.save().lineWidth(1.2).strokeColor(C.blue).moveTo(nx + 15, y + 19).lineTo(nx + 22, y + 12).moveTo(nx + 13, y + 21).lineTo(nx + 20, y + 14).stroke().restore();
  txt(doc, "QUICK NOTES", nx + 28, y + 12, { font: "B", size: 10.5, color: C.navy });
  let ny = y + 36;
  for (const note of report.notes) {
    dot(doc, nx + 18, ny + 4, 1.6, C.text);
    txt(doc, note, nx + 26, ny, { font: "R", size: 7.8, color: C.text, width: nw - 40, lineGap: 1 });
    ny += doc.font("R").fontSize(7.8).heightOfString(safe(note), { width: nw - 40, lineGap: 1 }) + 7;
    if (ny > y + h - 14) break;
  }
  return h;
}

const SUMMARY_FOOT = "This report is automatically generated from information recorded by your patients in DrSaab and is intended to support clinical discussion.";

function drawSummaryPages(doc, report, pageTotal, firstPage) {
  const chunks = [];
  const list = report.patients;
  for (let i = 0; i < Math.max(1, list.length); i += ROWS_PER_PAGE) chunks.push(list.slice(i, i + ROWS_PER_PAGE));
  let pageNo = 0;
  chunks.forEach((rows, idx) => {
    const last = idx === chunks.length - 1;
    const h = summaryPageHeight(rows.length, last);
    if (!(firstPage && idx === 0)) doc.addPage({ size: [W, h], margin: 0 });
    doc.rect(0, 0, W, h).fill(C.white);
    pageNo += 1;
    let y = 20;
    drawSummaryHeader(doc, y, report);
    y += 54 + 10;
    drawSummaryMeta(doc, y, report);
    y += 46 + 8;
    drawBanner(doc, y);
    y += 26 + 10;
    y += drawOverviewTable(doc, y, rows, list.length, idx > 0) + 24;
    if (last) {
      y += drawWeeklySummary(doc, y, report) + GAP;
      y += drawBreakdownAndNotes(doc, y, report) + GAP;
    }
    footer(doc, h - 40, pageNo, pageTotal, SUMMARY_FOOT);
  });
  return pageNo;
}

// ---------------------------------------------------------------------------
// Patient page
// ---------------------------------------------------------------------------
function drawPatientHeader(doc, y, report, p, index, count) {
  drawBrand(doc, M, y + 2, { size: 36, tagline: "A Smarter Way to Manage Diabetes" });
  const left = M + 160, right = W - M - 120;
  const title = "PATIENT HEALTH SNAPSHOT";
  const ts = fitSize(doc, title, "B", 17, right - left - 4, 11);
  txt(doc, title, left, y + 4, { font: "B", size: ts, color: C.navy, width: right - left, align: "center", chars: 0.3 });
  const pillText = count > 1 ? `PATIENT ${index + 1} OF ${count}` : "PATIENT SNAPSHOT";
  const pw = textWidth(doc, pillText, "B", 7.5) + 22;
  const px = left + (right - left - pw) / 2;
  doc.roundedRect(px, y + 28, pw, 15, 7.5).fill(C.blue);
  txt(doc, pillText, px, y + 32, { font: "B", size: 7.5, color: C.white, width: pw, align: "center", chars: 0.4 });
  // weekly report box
  const bx = W - M - 112;
  panel(doc, bx, y + 4, 112, 40, "#F7FAFF", C.cardBorder, 8);
  txt(doc, "WEEKLY REPORT", bx, y + 11, { font: "B", size: 8, color: C.navy, width: 112, align: "center", chars: 0.4 });
  txt(doc, report.period.label, bx, y + 25, { font: "R", size: fitSize(doc, report.period.label, "R", 8, 104, 6.5), color: C.text, width: 112, align: "center" });
}

function drawIdentity(doc, y, p) {
  const h = 56;
  card(doc, M, y, CW, h);
  avatar(doc, M + 30, y + h / 2, 19);
  txt(doc, p.name, M + 58, y + 12, { font: "B", size: fitSize(doc, p.name, "B", 15, 150, 9), color: C.text });
  txt(doc, `ID: ${p.id}`, M + 58, y + 33, { font: "R", size: 8, color: C.muted });
  let x = M + 220;
  doc.save().lineWidth(0.6).strokeColor(C.cardBorder).moveTo(x - 10, y + 12).lineTo(x - 10, y + h - 12).stroke().restore();
  const facts = [
    { icon: (cx, cy) => personOutline(doc, cx, cy, 8, C.blue), text: p.age != null ? `${p.age} years` : "Age —" },
    { icon: (cx, cy) => personOutline(doc, cx, cy, 8, C.blue), text: p.gender },
    { icon: (cx, cy) => calendar(doc, cx - 5, cy - 5, 10, C.blue), text: p.diabetesType },
  ];
  for (const f of facts) {
    f.icon(x + 6, y + h / 2);
    txt(doc, f.text, x + 16, y + h / 2 - 4, { font: "S", size: 8.2, color: C.text });
    x += textWidth(doc, f.text, "S", 8.2) + 38;
  }
  const cw = 96;
  const cx = W - M - cw - 8;
  panel(doc, cx, y + 9, cw, h - 18, "#F7FAFF", C.cardBorder, 7);
  txt(doc, "Connected On", cx, y + 15, { font: "R", size: 7, color: C.muted, width: cw, align: "center" });
  txt(doc, p.connectedOn, cx, y + 27, { font: "B", size: 9, color: C.text, width: cw, align: "center" });
  return h;
}

function drawPatientProfile(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 1, "PATIENT PROFILE", null, w - 20);
  const s = p.snapshot.profile;
  const rows = [
    ["Height", s.height_cm != null ? `${s.height_cm} cm` : "—"],
    ["Weight (Latest)", p.weightLatest ? `${p.weightLatest.value} kg${p.weightLatest.date ? " (" + p.weightLatest.date + ")" : ""}` : "—"],
    ["BMI", s.bmi != null ? `${s.bmi}${s.bmiCategory ? " (" + s.bmiCategory + ")" : ""}` : "—"],
    ["Health Profile", p.diabetesType],
  ];
  let ry = y + 44;
  for (const [k, v] of rows) {
    txt(doc, k, x + 14, ry, { font: "R", size: 8.2, color: C.muted });
    txt(doc, v, x + 92, ry, { font: "S", size: fitSize(doc, v, "S", 8.4, w - 104, 6.5), color: C.text });
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(x + 14, ry + 15).lineTo(x + w - 14, ry + 15).stroke().restore();
    ry += 24;
  }
}

function drawPatientGlucose(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 2, "LATEST GLUCOSE RESULTS", null, w - 20);
  const tx = x + 12, tw = w - 24;
  const cols = [
    { label: "Test", w: 0.25, align: "left" },
    { label: "Latest Result", w: 0.22, align: "center" },
    { label: "Date", w: 0.2, align: "center" },
    { label: "Time", w: 0.13, align: "center" },
    { label: "Status", w: 0.2, align: "left" },
  ];
  let ty = y + 40;
  doc.roundedRect(tx, ty, tw, 16, 4).fill("#EEF3FB");
  let cx = tx;
  for (const c of cols) {
    const cw = tw * c.w;
    txt(doc, c.label, cx + (c.align === "left" ? 8 : 0), ty + 4.5, { font: "S", size: 7, color: C.muted, width: cw - (c.align === "left" ? 8 : 0), align: c.align });
    cx += cw;
  }
  ty += 16;
  const s = p.snapshot.latest;
  const rows = [
    { label: "Fasting", icon: (ix, iy) => droplet(doc, ix, iy, 4.5, C.blue), r: s.fasting },
    { label: "Random", icon: (ix, iy) => droplet(doc, ix, iy, 4.5, C.purple), r: s.random },
    { label: "HbA1c", icon: (ix, iy) => { droplet(doc, ix, iy, 4.5, C.teal); }, r: s.hba1c },
  ];
  const rh = 26;
  for (const row of rows) {
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(tx, ty + rh).lineTo(tx + tw, ty + rh).stroke().restore();
    cx = tx;
    const r = row.r;
    cols.forEach((c, i) => {
      const cw = tw * c.w;
      if (i === 0) {
        row.icon(cx + 11, ty + rh / 2);
        txt(doc, row.label, cx + 20, ty + rh / 2 - 4.5, { font: "S", size: 8, color: C.text });
      } else if (i === 4) {
        const lv = r ? LEVEL[r.level] || LEVEL.unknown : null;
        dot(doc, cx + 6, ty + rh / 2, 3, lv ? lv.color : C.faint);
        const lbl = lv ? lv.label : "No data";
        txt(doc, lbl, cx + 13, ty + rh / 2 - 4.5, { font: "R", size: fitSize(doc, lbl, "R", 7.4, cw - 16, 6), color: r ? C.text : C.faint });
      } else {
        const val = i === 1 ? (r ? `${r.value} ${r.unit}` : "—") : i === 2 ? (r ? r.date : "Not recorded") : r ? r.time : "—";
        txt(doc, val, cx + 2, ty + rh / 2 - 4.5, { font: i === 1 ? "B" : "R", size: fitSize(doc, val, i === 1 ? "B" : "R", i === 1 ? 8.2 : 7.6, cw - 4, 6), color: r ? C.text : C.faint, width: cw - 4, align: "center" });
      }
      cx += cw;
    });
    ty += rh;
  }
}

function drawPatientTrend(doc, y, h, p) {
  card(doc, M, y, CW, h);
  sectionHeader(doc, M + 12, y + 12, 3, "GLUCOSE TREND", "(Last 14 Days)");
  const boxW = 110;
  const chartX = M + 14, chartW = CW - 28 - boxW - 14;
  let py = y + 36;
  dot(doc, chartX + 4, py + 4, 3, C.blue);
  txt(doc, "Fasting (mg/dL)", chartX + 11, py, { font: "R", size: 7.2, color: C.text });
  dot(doc, chartX + 92, py + 4, 3, C.purple);
  txt(doc, "Random (mg/dL)", chartX + 99, py, { font: "R", size: 7.2, color: C.text });
  py += 14;
  const chartH = h - (py - y) - 24;
  lineChart(doc, {
    x: chartX, y: py, w: chartW, h: chartH,
    series: p.snapshot.trends.weekly.series,
    fields: [{ key: "fasting", color: C.blue }, { key: "random", color: C.purple }],
    xLabels: weeklyLabels(p.snapshot.trends.weekly.series),
    emptyText: "No readings in the last 14 days",
  });
  const bx = M + CW - 14 - boxW;
  panel(doc, bx, y + 36, boxW, h - 50, "#F7FAFF", C.cardBorder, 8);
  txt(doc, "Readings This Week", bx, y + 44, { font: "S", size: 7.4, color: C.text, width: boxW, align: "center" });
  doc.save().lineWidth(0.5).strokeColor(C.cardBorder).moveTo(bx + 10, y + 58).lineTo(bx + boxW - 10, y + 58).stroke().restore();
  txt(doc, "Fasting", bx + 12, y + 70, { font: "R", size: 8, color: C.text });
  txt(doc, String(p.week.fasting), bx + boxW - 12 - 30, y + 68, { font: "B", size: 11, color: C.text, width: 30, align: "right" });
  txt(doc, "Random", bx + 12, y + 94, { font: "R", size: 8, color: C.text });
  txt(doc, String(p.week.random), bx + boxW - 12 - 30, y + 92, { font: "B", size: 11, color: C.text, width: 30, align: "right" });
}

function drawPatientLabs(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 4, "OTHER HEALTH RESULTS", "(Latest Available)", w - 20);
  const labs = p.snapshot.labs;
  const items = labs.items.slice(0, 6);
  if (!items.length) {
    txt(doc, "No lab results on record yet.", x + 14, y + 46, { font: "S", size: 8, color: C.faint, width: w - 28 });
    txt(doc, "Values appear here once the patient uploads a report through Explain My Report.", x + 14, y + 60, { font: "R", size: 7.2, color: C.faint, width: w - 28, lineGap: 1.5 });
    return;
  }
  const tx = x + 12, tw = w - 24;
  const cols = [
    { label: "Test", w: 0.34, align: "left" },
    { label: "Result", w: 0.24, align: "center" },
    { label: "Date", w: 0.2, align: "center" },
    { label: "Status", w: 0.22, align: "left" },
  ];
  let ty = y + 40;
  doc.roundedRect(tx, ty, tw, 15, 4).fill("#EEF3FB");
  let cx = tx;
  for (const c of cols) {
    const cw = tw * c.w;
    txt(doc, c.label, cx + (c.align === "left" ? 6 : 0), ty + 4, { font: "S", size: 6.8, color: C.muted, width: cw - (c.align === "left" ? 6 : 0), align: c.align });
    cx += cw;
  }
  ty += 15;
  const rh = 15.5;
  for (const l of items) {
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(tx, ty + rh).lineTo(tx + tw, ty + rh).stroke().restore();
    cx = tx;
    const status = { label: LAB_LABEL[l.label] || l.label, tone: l.tone };
    cols.forEach((c, i) => {
      const cw = tw * c.w;
      if (i === 0) txt(doc, l.name, cx + 6, ty + 4, { font: "S", size: fitSize(doc, l.name, "S", 7.4, cw - 8, 5.8), color: C.text });
      else if (i === 1) txt(doc, l.value, cx, ty + 4, { font: "R", size: fitSize(doc, l.value, "R", 7.2, cw - 4, 5.8), color: C.text, width: cw, align: "center" });
      else if (i === 2) txt(doc, l.date || "—", cx, ty + 4, { font: "R", size: 6.8, color: C.muted, width: cw, align: "center" });
      else {
        dot(doc, cx + 5, ty + 7.5, 2.6, TONE_COLOR[status.tone] || C.faint);
        txt(doc, status.label, cx + 11, ty + 4, { font: "R", size: fitSize(doc, status.label, "R", 7, cw - 13, 5.6), color: status.tone === "muted" ? C.faint : C.text });
      }
      cx += cw;
    });
    ty += rh;
  }
  txt(doc, `Showing latest ${items.length} of ${labs.total} results`, x + 14, y + h - 15, { font: "R", size: 6.8, color: C.blue });
}

function drawPatientMeds(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 5, "CURRENT MEDICINES", null, w - 20);
  const meds = p.snapshot.medicines.slice(0, 5);
  let my = y + 42;
  if (!meds.length) {
    txt(doc, "No medicines on record.", x + 14, my + 4, { font: "S", size: 8, color: C.faint, width: w - 28 });
  }
  for (const m of meds) {
    dot(doc, x + 18, my + 5, 2.2, C.blue);
    const line1 = [m.name, m.dose].filter(Boolean).join(" ");
    txt(doc, line1, x + 26, my, { font: "S", size: fitSize(doc, line1, "S", 8.2, w - 40, 6.5), color: C.text, width: w - 40, ellipsis: true, height: 11 });
    if (m.frequency) txt(doc, m.frequency, x + 26, my + 11, { font: "R", size: 7, color: C.muted, width: w - 40, ellipsis: true, height: 10 });
    my += m.frequency ? 23 : 14;
  }
  const n = p.snapshot.medicines.length;
  txt(doc, `Total: ${n} active medicine${n === 1 ? "" : "s"}`, x + 14, y + h - 15, { font: "R", size: 7, color: C.blue });
}

function drawPatientActivity(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 6, "ACTIVITY & CHALLENGES", "(This Week)", w - 20);
  const ls = p.snapshot.lifestyle;
  const items = [
    { color: C.green, glyph: (cx, cy) => footprint(doc, cx, cy, 8, C.white), label: ["Activity", "Check-ins"], big: String(p.week.activity) },
    { color: C.purple, glyph: (cx, cy) => pill(doc, cx, cy, 8, C.white), label: ["Medication", "Check-ins"], big: String(p.week.medication) },
    { color: C.blue, glyph: (cx, cy) => scaleIcon(doc, cx, cy, 8, C.white), label: ["Latest", "Weight"], big: p.weightLatest ? `${p.weightLatest.value} kg` : "—", sub: p.weightLatest?.date || "" },
    { color: C.amber, glyph: (cx, cy) => sparkle(doc, cx, cy, 8, C.white), label: ["Active", "Challenges"], big: String(ls.activeChallenges) },
  ];
  const n = items.length;
  const cw = (w - 24) / n;
  items.forEach((it, i) => {
    const cx = x + 12 + cw * i + cw / 2;
    const cy = y + 54;
    doc.circle(cx, cy, 15).fill(it.color);
    it.glyph(cx, cy);
    txt(doc, it.label[0], cx - cw / 2, cy + 20, { font: "R", size: 6.8, color: C.muted, width: cw, align: "center" });
    txt(doc, it.label[1], cx - cw / 2, cy + 29, { font: "R", size: 6.8, color: C.muted, width: cw, align: "center" });
    txt(doc, it.big, cx - cw / 2, cy + 40, { font: "B", size: fitSize(doc, it.big, "B", 11, cw - 6, 8), color: C.text, width: cw, align: "center" });
    if (it.sub) txt(doc, it.sub, cx - cw / 2, cy + 53, { font: "R", size: 6.2, color: C.muted, width: cw, align: "center" });
  });
  const names = ls.challengeNames.length ? ls.challengeNames.join("  ·  ") : "none active";
  const line = `Challenges:  ${names}`;
  txt(doc, line, x + 14, y + h - 15, { font: "R", size: fitSize(doc, line, "R", 7.2, w - 28, 5.8), color: C.text });
}

function drawPatientDataSummary(doc, x, y, w, h, p) {
  card(doc, x, y, w, h);
  sectionHeader(doc, x + 12, y + 12, 7, "DATA SUMMARY", "(This Week)", w - 20);
  const rows = [
    ["Fasting Readings", p.week.fasting],
    ["Random Readings", p.week.random],
    ["Medication Check-ins", p.week.medication],
    ["Activity Check-ins", p.week.activity],
    ["Weight Entries", p.week.weight],
    ["New Reports Uploaded", p.week.reports],
  ];
  let ry = y + 40;
  for (const [k, v] of rows) {
    txt(doc, k, x + 14, ry, { font: "R", size: 7.8, color: C.text });
    txt(doc, String(v), x + w - 14 - 30, ry, { font: "B", size: 8.4, color: C.text, width: 30, align: "right" });
    doc.save().lineWidth(0.5).strokeColor(C.line).moveTo(x + 14, ry + 13).lineTo(x + w - 14, ry + 13).stroke().restore();
    ry += 17;
  }
}

const PATIENT_FOOT = "This snapshot is automatically generated from information the patient has recorded in DrSaab. It is intended to support — not replace — clinical judgement.";

function drawPatientPage(doc, report, p, index, count, pageNo, pageTotal, firstPage) {
  const h = PATIENT_PAGE_H;
  if (!firstPage) doc.addPage({ size: [W, h], margin: 0 });
  doc.rect(0, 0, W, h).fill(C.white);
  let y = 20;
  drawPatientHeader(doc, y, report, p, index, count);
  y += 50 + 8;
  y += drawIdentity(doc, y, p) + 10;

  const H_A = 150;
  const profW = 210;
  drawPatientProfile(doc, M, y, profW, H_A, p);
  drawPatientGlucose(doc, M + profW + GAP, y, CW - profW - GAP, H_A, p);
  y += H_A + 10;

  const H_T = 158;
  drawPatientTrend(doc, y, H_T, p);
  y += H_T + 10;

  const H_B = 172;
  const labsW = 300;
  drawPatientLabs(doc, M, y, labsW, H_B, p);
  drawPatientMeds(doc, M + labsW + GAP, y, CW - labsW - GAP, H_B, p);
  y += H_B + 10;

  const H_C = 150;
  const actW = 300;
  drawPatientActivity(doc, M, y, actW, H_C, p);
  drawPatientDataSummary(doc, M + actW + GAP, y, CW - actW - GAP, H_C, p);

  footer(doc, h - 40, pageNo, pageTotal, PATIENT_FOOT);
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------
function collect(doc) {
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function renderDoctorWeeklyPdf(report) {
  const n = report.patients.length;
  const summaryPages = Math.max(1, Math.ceil(n / ROWS_PER_PAGE));
  const pageTotal = summaryPages + n;
  const firstH = summaryPageHeight(Math.min(n, ROWS_PER_PAGE), summaryPages === 1);
  const doc = new PDFDocument({
    size: [W, firstH],
    margin: 0,
    info: { Title: `DrSaab Weekly Patient Snapshots — ${safe(report.doctor.name)}`, Author: "DrSaab AI", Creator: "DrSaab" },
  });
  const done = collect(doc);
  registerFonts(doc);
  let pageNo = drawSummaryPages(doc, report, pageTotal, true);
  report.patients.forEach((p, i) => {
    pageNo += 1;
    drawPatientPage(doc, report, p, i, n, pageNo, pageTotal, false);
  });
  doc.end();
  return done;
}

export async function renderPatientSnapshotPdf(report, index = 0) {
  const p = report.patients[index];
  if (!p) throw new Error("patient index out of range");
  const doc = new PDFDocument({
    size: [W, PATIENT_PAGE_H],
    margin: 0,
    info: { Title: `DrSaab Patient Health Snapshot — ${safe(p.name)}`, Author: "DrSaab AI", Creator: "DrSaab" },
  });
  const done = collect(doc);
  registerFonts(doc);
  drawPatientPage(doc, report, p, 0, 1, 1, 1, true);
  doc.end();
  return done;
}

export { fmtDate as _fmtDate };
