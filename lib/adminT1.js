// Shared table metadata for the T1 Content admin CRUD. Keeping the config here
// means the [kind] route stays generic and the frontend can render forms from
// the same shape.

const CATEGORIES = ["children_parents", "teens_young_adults", "adults"];
const AUDIENCES = ["general", "newly_diagnosed", "parents", "exercise", "ramadan"];

// Each entry describes: table name + editable columns + how each column is
// coerced from JSON input. `active` and `sort_order` are always allowed.
export const T1_KINDS = {
  organizations: {
    table: "t1_organizations",
    label: "Organizations",
    columns: [
      { name: "name",          type: "string",  required: true,  max: 200 },
      { name: "description",   type: "string",  max: 2000 },
      { name: "logo_url",      type: "string",  max: 500 },
      { name: "website",       type: "string",  max: 500 },
      { name: "contact",       type: "string",  max: 200 },
      { name: "facebook_url",  type: "string",  max: 500 },
      { name: "instagram_url", type: "string",  max: 500 },
      { name: "twitter_url",   type: "string",  max: 500 },
      { name: "youtube_url",   type: "string",  max: 500 },
    ],
  },
  articles: {
    table: "t1_articles",
    label: "Articles",
    columns: [
      { name: "title",    type: "string", required: true, max: 200 },
      { name: "summary",  type: "string", max: 1000 },
      { name: "url",      type: "string", required: true, max: 500 },
      { name: "source",   type: "string", max: 100 },
      { name: "audience", type: "enum",   values: AUDIENCES, defaultValue: "general" },
      { name: "tags",     type: "csv" },
    ],
  },
  videos: {
    table: "t1_videos",
    label: "Videos",
    columns: [
      { name: "title",       type: "string", required: true, max: 200 },
      { name: "description", type: "string", max: 1000 },
      { name: "url",         type: "string", required: true, max: 500 },
      { name: "source",      type: "string", max: 100 },
      { name: "audience",    type: "enum",   values: AUDIENCES, defaultValue: "general" },
      { name: "tags",        type: "csv" },
    ],
  },
  topics: {
    table: "t1_daily_life_topics",
    label: "Daily Life Topics",
    columns: [
      { name: "category", type: "enum",   values: CATEGORIES, required: true },
      { name: "title",    type: "string", required: true, max: 200 },
      { name: "pdf_url",  type: "string", max: 500 },
    ],
  },
  events: {
    table: "t1_events",
    label: "Events",
    columns: [
      { name: "description", type: "string", required: true, max: 500 },
      { name: "event_date",  type: "date" },
      { name: "url",         type: "string", max: 500 },
    ],
  },
};

export function kindConfig(kind) {
  return T1_KINDS[kind] || null;
}

// Coerce a JSON payload into the values the DB expects. Returns
// { values: { col: val, ... }, error: string | null }.
export function coerceRow(kind, body, { partial = false } = {}) {
  const cfg = kindConfig(kind);
  if (!cfg) return { error: `unknown kind: ${kind}` };
  const values = {};
  for (const col of cfg.columns) {
    const raw = body?.[col.name];
    const missing = raw === undefined || raw === null || raw === "";
    if (missing) {
      if (partial) continue;
      if (col.required) return { error: `${col.name} is required` };
      values[col.name] = col.defaultValue ?? null;
      continue;
    }
    switch (col.type) {
      case "string": {
        const s = String(raw).trim();
        if (col.max && s.length > col.max) return { error: `${col.name} too long` };
        values[col.name] = s;
        break;
      }
      case "enum": {
        const s = String(raw).trim();
        if (!col.values.includes(s)) return { error: `${col.name} must be one of: ${col.values.join(", ")}` };
        values[col.name] = s;
        break;
      }
      case "csv": {
        // Accept either an array or a comma-separated string.
        const arr = Array.isArray(raw)
          ? raw
          : String(raw).split(",").map((t) => t.trim()).filter(Boolean);
        values[col.name] = arr;
        break;
      }
      case "date": {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return { error: `${col.name} is not a valid date` };
        // Store just the date part (YYYY-MM-DD) for `date` columns.
        values[col.name] = d.toISOString().slice(0, 10);
        break;
      }
      default:
        return { error: `unknown column type ${col.type}` };
    }
  }
  // Common columns.
  if (body?.sort_order !== undefined && body.sort_order !== "") {
    const n = parseInt(body.sort_order, 10);
    if (!Number.isFinite(n)) return { error: "sort_order must be a number" };
    values.sort_order = n;
  } else if (!partial) {
    values.sort_order = 0;
  }
  if (body?.active !== undefined) values.active = !!body.active;
  else if (!partial) values.active = true;

  return { values };
}

// All non-id columns for this kind (list + sort_order + active). Used by the
// list endpoint's SELECT and the create endpoint's INSERT.
export function selectColumns(kind) {
  const cfg = kindConfig(kind);
  if (!cfg) return null;
  return ["id", ...cfg.columns.map((c) => c.name), "sort_order", "active", "created_at", "updated_at"];
}
