import { pool } from "@/lib/db";

// Feedback inbox tables (bot "Feedback" command → admin Feedback page).
// Same DDL as FEEDBACK_DDL in bot/src/supabase.js and bot/db/schema.sql —
// keep the three in sync. Created here too so the admin page works before
// the first feedback has ever been sent.
const DDL = `
  create table if not exists feedback (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references users(id) on delete set null,
    user_name   text,
    user_phone  text,
    user_type   text,
    source      text,
    message     text not null default '',
    status      text not null default 'new',
    created_at  timestamptz default now()
  );
  create index if not exists feedback_created_idx on feedback(created_at desc);
  create table if not exists feedback_attachments (
    id           uuid primary key default gen_random_uuid(),
    feedback_id  uuid not null references feedback(id) on delete cascade,
    kind         text not null,
    mime         text,
    filename     text,
    data_url     text not null,
    created_at   timestamptz default now()
  );
  create index if not exists feedback_attachments_fb_idx on feedback_attachments(feedback_id);
`;

const g = globalThis;

export function ensureFeedbackTables() {
  if (!g.__drsaabFeedbackReady) {
    g.__drsaabFeedbackReady = pool.query(DDL).catch((e) => {
      g.__drsaabFeedbackReady = null;
      throw e;
    });
  }
  return g.__drsaabFeedbackReady;
}
