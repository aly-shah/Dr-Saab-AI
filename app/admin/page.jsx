"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, LineChart, Donut } from "@/components/admin/charts";

function timeAgo(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line/70 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ring-1 ring-line/70 shadow-soft ${className}`}>
      {title && <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>}
      {children}
    </div>
  );
}

const NAV = [
  { key: "overview", label: "Overview", d: "M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-5H4v5z" },
  { key: "patients", label: "Patients", d: "M16 11a4 4 0 1 0-8 0M3 20a6 6 0 0 1 18 0" },
  { key: "doctors", label: "Doctors", d: "M9 3v4a3 3 0 0 0 6 0V3M6 21v-2a6 6 0 0 1 12 0v2" },
  { key: "leaderboard", label: "Leaderboard", d: "M8 21h8M12 17v4M5 4h14v4a7 7 0 0 1-14 0V4z" },
];

function NavBtn({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-primary text-white shadow-soft" : "text-ink/70 hover:bg-muted"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={item.d} />
      </svg>
      {item.label}
    </button>
  );
}

function Login({ onDone }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) onDone();
    else setErr("Incorrect password");
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-cloud/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card ring-1 ring-line/70">
        <h1 className="text-xl font-bold text-ink">Dr Saab AI — Admin</h1>
        <p className="mt-1 text-sm text-ink/55">Enter the admin password to continue.</p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus
          className="mt-5 w-full rounded-xl bg-muted px-4 py-3 text-ink outline-none ring-1 ring-transparent focus:ring-primary" />
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary mt-4 w-full">{busy ? "Checking…" : "Sign in"}</button>
      </form>
    </div>
  );
}

function PatientDrawer({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    fetch(`/api/admin/patient?id=${id}`).then((r) => r.json()).then(setData).catch(() => setData({ error: "x" }));
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-cloud/60 p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Patient details</h2>
          <button onClick={onClose} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line">Close</button>
        </div>
        {!data && <p className="mt-8 text-ink/50">Loading…</p>}
        {data?.error && <p className="mt-8 text-red-500">Failed to load.</p>}
        {data?.user && (
          <div className="mt-5 space-y-4">
            <Panel title="Profile">
              <div className="grid grid-cols-2 gap-y-1.5 text-sm text-ink/75">
                <span className="text-ink/45">Name</span><span>{data.user.name || "—"}</span>
                <span className="text-ink/45">Age / Gender</span><span>{data.user.age ?? "—"} / {data.user.gender || "—"}</span>
                <span className="text-ink/45">City</span><span>{data.user.city || "—"}</span>
                <span className="text-ink/45">Language</span><span>{data.user.language}</span>
                <span className="text-ink/45">Diabetes</span><span>{data.user.diabetes_status || "—"}</span>
                <span className="text-ink/45">Plan</span><span className="capitalize">{data.user.tier}</span>
                <span className="text-ink/45">Streak</span><span>{data.user.streak || 0} days</span>
                <span className="text-ink/45">Doctor code</span><span>{data.user.doctor_code || "—"}</span>
              </div>
            </Panel>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Avg sugar" value={data.clinic?.avg ?? "—"} sub="mg/dL" />
              <Stat label="Est. HbA1c" value={data.clinic?.hba1c != null ? `${data.clinic.hba1c}%` : "—"} />
              <Stat label="BMI" value={data.clinic?.bmi ?? "—"} />
            </div>

            <Panel title="Blood sugar trend"><LineChart data={data.glucose} /></Panel>

            {data.kb?.content && (
              <Panel title="Knowledge base (auto-generated)">
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 text-[12px] leading-relaxed text-ink/75">{data.kb.content}</pre>
              </Panel>
            )}

            <Panel title={`Conversation (${data.messages.length})`}>
              {data.messages.length === 0 && <p className="text-sm text-ink/45">No coach messages yet.</p>}
              <div className="space-y-2">
                {data.messages.slice().reverse().map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] ${m.role === "user" ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-line/60"}`}>
                      <span className="mb-0.5 block text-[9px] uppercase tracking-wide opacity-60">{m.kind}</span>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorsView() {
  const [doctors, setDoctors] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const load = useCallback(() => {
    fetch("/api/admin/doctors").then((r) => r.json()).then((d) => setDoctors(d.doctors || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    const d = await res.json();
    if (res.ok) { setName(""); setCode(""); load(); }
    else setMsg(d.error || "Failed");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Panel title="Create doctor referral code">
        <form onSubmit={create} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Doctor name (e.g. Dr. Khan)"
            className="w-full rounded-xl bg-muted px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-primary" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. KHAN10)"
            className="w-full rounded-xl bg-muted px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-primary" />
          {msg && <p className="text-sm text-red-500">{msg}</p>}
          <button className="btn-primary w-full">Create code</button>
        </form>
        <p className="mt-3 text-xs text-ink/50">Patients who enter this code during onboarding are counted under this doctor.</p>
      </Panel>

      <Panel title={`Doctors${doctors ? ` (${doctors.length})` : ""}`}>
        {!doctors && <p className="text-sm text-ink/45">Loading…</p>}
        {doctors && doctors.length === 0 && <p className="text-sm text-ink/45">No codes yet — create one.</p>}
        {doctors && doctors.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line/60 text-[11px] uppercase tracking-wider text-ink/40">
                <th className="py-2 pr-3">Doctor</th><th className="px-3">Code</th><th className="px-3 text-right">Referrals</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-b border-line/40">
                  <td className="py-2.5 pr-3 font-medium text-ink">{d.name}</td>
                  <td className="px-3"><code className="rounded bg-muted px-2 py-0.5 text-[12px] text-primary">{d.code}</code></td>
                  <td className="px-3 text-right font-bold text-accent">{d.referrals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Leaderboard({ rows }) {
  const medal = ["bg-amber-400", "bg-slate-300", "bg-orange-400"];
  return (
    <Panel title="Top patients — consistency leaderboard">
      <div className="space-y-1.5">
        {(!rows || rows.length === 0) && <p className="text-sm text-ink/45">No data yet.</p>}
        {rows?.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/50">
            <span className={`grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-bold text-white ${medal[i] || "bg-ink/30"}`}>{i + 1}</span>
            <span className="flex-1 font-medium text-ink">{p.name || "—"}<span className="ml-2 text-xs text-ink/40">{p.city || ""}</span></span>
            <span className="text-sm font-semibold text-accent">{p.streak || 0}-day</span>
            <span className="w-24 text-right text-xs text-ink/50">{p.readings_week} readings/wk</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(null);
  const [data, setData] = useState(null);
  const [view, setView] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data");
    if (res.status === 401) return setAuthed(false);
    const d = await res.json();
    if (d.error) setError(d.error);
    else { setData(d); setAuthed(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (authed === false) return <Login onDone={load} />;
  if (authed === null || !data) return <div className="grid min-h-dvh place-items-center text-ink/50">{error || "Loading…"}</div>;

  const t = data.totals;

  return (
    <div className="flex min-h-dvh bg-cloud/40">
      {/* sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-56 flex-col border-r border-line/60 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">D</span>
          <span className="font-bold text-ink">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => <NavBtn key={n.key} item={n} active={view === n.key} onClick={() => setView(n.key)} />)}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <button onClick={load} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/60 hover:bg-muted">Refresh</button>
          <button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); }}
            className="rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/60 hover:bg-muted">Log out</button>
        </div>
      </aside>

      <div className="flex-1">
        {/* mobile nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-line/60 bg-white p-3 md:hidden">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setView(n.key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${view === n.key ? "bg-primary text-white" : "bg-muted text-ink/70"}`}>{n.label}</button>
          ))}
        </div>

        <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-7">
          {view === "overview" && (
            <>
              <h2 className="text-xl font-bold text-ink">Overview</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <Stat label="Patients" value={t.total_patients} sub={`${t.onboarded} onboarded`} />
                <Stat label="Active today" value={t.active_today} />
                <Stat label="Active this week" value={t.active_week} />
                <Stat label="Messages" value={t.total_messages} />
                <Stat label="Premium" value={data.tiers.find((x) => x.tier === "consistency_builder")?.n || 0} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Panel title="New patients (14 days)"><BarChart data={data.signups} color="#0891B2" /></Panel>
                <Panel title="Messages / day (14 days)"><BarChart data={data.messages} color="#059669" /></Panel>
                <Panel title="Avg glucose / day"><LineChart data={data.glucoseByDay.map((d) => ({ value_mgdl: d.avg }))} /></Panel>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Diabetes status"><Donut data={data.statuses} labelKey="status" /></Panel>
                <Panel title="Plan breakdown"><Donut data={data.tiers} labelKey="tier" /></Panel>
              </div>
            </>
          )}

          {view === "patients" && (
            <>
              <h2 className="text-xl font-bold text-ink">Patients ({data.patients.length})</h2>
              <Panel>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line/60 text-[11px] uppercase tracking-wider text-ink/40">
                        <th className="py-2 pr-3">Name</th><th className="px-3">Age</th><th className="px-3">City</th>
                        <th className="px-3">Diabetes</th><th className="px-3">Lang</th><th className="px-3">Plan</th>
                        <th className="px-3">Streak</th><th className="px-3">Avg sugar</th><th className="px-3">Msgs</th><th className="px-3">Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.patients.map((p) => (
                        <tr key={p.id} onClick={() => setSelected(p.id)} className="cursor-pointer border-b border-line/40 hover:bg-muted/50">
                          <td className="py-2.5 pr-3 font-medium text-ink">{p.name || "—"}</td>
                          <td className="px-3 text-ink/70">{p.age ?? "—"}</td>
                          <td className="px-3 text-ink/70">{p.city || "—"}</td>
                          <td className="px-3 text-ink/70">{p.diabetes_status || "—"}</td>
                          <td className="px-3 text-ink/70">{p.language}</td>
                          <td className="px-3">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.tier === "consistency_builder" ? "bg-accent/12 text-accent" : "bg-muted text-ink/60"}`}>
                              {p.tier === "consistency_builder" ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="px-3 text-ink/70">{p.streak || 0}</td>
                          <td className="px-3 text-ink/70">{p.glucose_avg_week ?? "—"}</td>
                          <td className="px-3 text-ink/70">{p.message_count}</td>
                          <td className="px-3 text-ink/50">{timeAgo(p.last_seen)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}

          {view === "doctors" && (
            <>
              <h2 className="text-xl font-bold text-ink">Doctors &amp; referrals</h2>
              <DoctorsView />
            </>
          )}

          {view === "leaderboard" && (
            <>
              <h2 className="text-xl font-bold text-ink">Leaderboard</h2>
              <Leaderboard rows={data.leaderboard} />
            </>
          )}
        </div>
      </div>

      {selected && <PatientDrawer id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
