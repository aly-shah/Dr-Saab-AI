-- =============================================================================
-- One-off backfill: 40 glucose readings for Rukhsana Abbasi
-- User UUID: 84995d53-59fe-4674-9e3d-f2ffd6156b7f
-- Times are Asia/Karachi (PKT).
--
-- How to run on the VPS:
--   scp bot/db/rukhsana_glucose_backfill.sql <user>@drsaabcoach.com:/tmp/
--   ssh <user>@drsaabcoach.com \
--     "sudo -u postgres psql -d drsaab -f /tmp/rukhsana_glucose_backfill.sql"
--
-- Expected output: INSERT 0 40, inserted = 40, COMMIT.
-- =============================================================================

BEGIN;

INSERT INTO glucose_logs (user_id, value_mgdl, context, created_at)
SELECT '84995d53-59fe-4674-9e3d-f2ffd6156b7f'::uuid,
       v.value_mgdl,
       v.context,
       (v.ts::timestamp AT TIME ZONE 'Asia/Karachi')
FROM (VALUES
  (104::numeric, 'fasting', '2026-06-11 10:30 AM'),
  (131,          'random',  '2026-06-11 6:30 PM'),
  (123,          'fasting', '2026-06-12 11:50 AM'),
  (127,          'fasting', '2026-06-16 11:00 AM'),
  (117,          'fasting', '2026-06-17 11:00 AM'),
  (120,          'fasting', '2026-06-18 11:30 AM'),
  (119,          'random',  '2026-06-18 6:30 PM'),
  (105,          'fasting', '2026-06-20 12:00 PM'),
  (130,          'fasting', '2026-06-21 11:00 AM'),
  (103,          'random',  '2026-06-21 9:30 PM'),
  (120,          'fasting', '2026-06-22 12:00 PM'),
  ( 93,          'fasting', '2026-06-23 12:00 PM'),
  (125,          'fasting', '2026-06-24 1:00 PM'),
  (103,          'random',  '2026-06-24 7:00 PM'),
  (119,          'fasting', '2026-06-28 12:50 PM'),
  (142,          'random',  '2026-06-28 7:00 PM'),
  (132,          'fasting', '2026-06-29 12:00 PM'),
  (101,          'fasting', '2026-07-01 11:30 AM'),
  (136,          'fasting', '2026-07-02 11:50 AM'),
  (104,          'fasting', '2026-07-03 11:30 AM'),
  (143,          'fasting', '2026-07-04 12:00 PM'),
  (104,          'fasting', '2026-07-05 11:45 AM'),
  (126,          'fasting', '2026-07-06 11:35 AM'),
  (130,          'fasting', '2026-07-08 11:00 AM'),
  (136,          'fasting', '2026-07-09 12:00 PM'),
  (150,          'fasting', '2026-07-10 11:15 AM'),
  (152,          'fasting', '2026-07-12 12:00 PM'),
  (133,          'fasting', '2026-07-13 11:30 AM'),
  (119,          'fasting', '2026-07-18 12:50 PM'),
  ( 98,          'fasting', '2026-07-19 1:25 PM'),
  ( 97,          'fasting', '2026-07-20 12:00 PM'),
  (117,          'fasting', '2026-07-21 11:00 AM'),
  (151,          'fasting', '2026-07-23 1:00 PM'),
  (139,          'fasting', '2026-07-24 11:45 AM'),
  (130,          'random',  '2026-07-24 8:45 PM'),
  (168,          'fasting', '2026-07-25 12:30 PM'),
  (142,          'fasting', '2026-07-26 1:00 PM'),
  (100,          'fasting', '2026-07-27 10:35 AM'),
  (174,          'fasting', '2026-07-28 11:20 AM'),
  (111,          'fasting', '2026-07-29 10:10 AM')
) AS v(value_mgdl, context, ts);

SELECT count(*) AS inserted
FROM glucose_logs
WHERE user_id = '84995d53-59fe-4674-9e3d-f2ffd6156b7f'
  AND created_at BETWEEN '2026-06-11' AND '2026-07-30';

COMMIT;
