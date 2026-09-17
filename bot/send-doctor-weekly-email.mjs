// Manual check / send for the weekly doctor report email, so SMTP can be
// tested without waiting for the weekly slot. Run from bot/:
//
//   node send-doctor-weekly-email.mjs --verify
//       log in to the SMTP server, send nothing
//   node send-doctor-weekly-email.mjs --list
//       who would be emailed right now (doctor, email, connected patients)
//   node send-doctor-weekly-email.mjs --doctor dr@clinic.pk
//       send that doctor's report now (matches doctors.email or doctors.id)
//   node send-doctor-weekly-email.mjs --doctor dr@clinic.pk --to me@example.com
//       same report, delivered to another inbox (a safe test)
//
// Manual sends bypass the once-per-week log, so they never block or replace
// the scheduled Sunday email.

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const db = await import("./src/supabase.js");
const { verifyMail, mailEnabled } = await import("./src/mailer.js");
const { emailDoctorWeeklyReport, weeklySlot, validEmail } = await import("./src/doctorWeeklyEmail.js");

async function main() {
  if (flag("--verify")) {
    await verifyMail();
    return console.log("SMTP login OK.");
  }

  const doctors = await db.listDoctorsWithEmail();

  if (flag("--list")) {
    for (const d of doctors) {
      const n = (await db.doctorPatientStats(d.id)).length;
      const verdict = !validEmail(d.email) ? "skip (invalid email)" : n ? "WILL RECEIVE" : "skip (no connected patients)";
      console.log(`${verdict.padEnd(30)} ${String(d.name || "").padEnd(28)} ${d.email}  patients=${n}`);
    }
    const { weekKey, due } = weeklySlot();
    return console.log(`\n${doctors.length} doctor(s) with an email. Latest slot ${weekKey}, send window ${due ? "OPEN" : "closed"}. Email ${mailEnabled() ? "configured" : "NOT configured"}.`);
  }

  const who = value("--doctor");
  if (!who) return console.log("Use --verify, --list or --doctor <email|id> [--to <address>]. See the header of this file.");
  const needle = who.trim().toLowerCase();
  const doc = doctors.find((d) => String(d.id) === who || String(d.email).trim().toLowerCase() === needle);
  if (!doc) return console.log(`No doctor with email or id "${who}".`);
  const to = value("--to");
  const result = await emailDoctorWeeklyReport(to ? { ...doc, email: to } : doc, weeklySlot().weekKey, { force: true });
  console.log(result);
}

main()
  .catch((e) => { console.error("Failed:", e?.message || e); process.exitCode = 1; })
  .finally(() => setTimeout(() => process.exit(), 500));
