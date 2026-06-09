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
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
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
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="mt-5 w-full rounded-xl bg-muted px-4 py-3 text-ink outline-none ring-1 ring-transparent focus:ring-primary"
          autoFocus
        />
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary mt-4 w-full">
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function PatientDrawer({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    fetch(`/api/admin/patient?id=${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: "failed" }));
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-cloud/60 p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Patient details</h2>
          <button onClick={onClose} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line">
            Close
          </button>
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
                <span className="text-ink/45">Weight</span><span>{data.user.weight_kg ?? "—"} kg</span>
                <span className="text-ink/45">Plan</span><span className="capitalize">{data.user.tier}</span>
                <span className="text-ink/45">Streak</span><span>{data.user.streak || 0} days</span>
                <span className="text-ink/45">Goals</span><span>{data.user.goals || "—"}</span>
                <span className="text-ink/45">Medications</span><span>{data.user.medications || "—"}</span>
              </div>
            </Panel>

            <Panel title="Blood sugar trend">
              <LineChart data={data.glucose} />
            </Panel>

            {data.kb?.content && (
              <Panel title="Knowledge base (auto-generated)">
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 text-[12px] leading-relaxed text-ink/75">
{data.kb.content}
                </pre>
              </Panel>
            )}

            <Panel title={`Conversation (${data.messages.length})`}>
              {data.messages.length === 0 && <p className="text-sm text-ink/45">No coach messages yet.</p>}
              <div className="space-y-2">
                {data.messages.slice().reverse().map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] ${
                        m.role === "user" ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-line/60"
                      }`}
                    >
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

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null=unknown, false=login, true=ok
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const d = await res.json();
    if (d.error) setError(d.error);
    else {
      setData(d);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (authed === false) return <Login onDone={load} />;
  if (authed === null || !data)
    return <div className="grid min-h-dvh place-items-center text-ink/50">{error || "Loading…"}</div>;

  const t = data.totals;

  return (
    <main className="min-h-dvh bg-cloud/40">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <h1 className="text-lg font-bold text-ink">Dr Saab <span className="text-primary">AI</span> · Admin</h1>
          <div className="flex items-center gap-2">
            <button onClick={load} className="rounded-full bg-muted px-3.5 py-1.5 text-sm font-semibold text-ink/70 ring-1 ring-line">
              Refresh
            </button>
            <button
              onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); }}
              className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink/70 ring-1 ring-line"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-7">
        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat label="Patients" value={t.total_patients} sub={`${t.onboarded} onboarded`} />
          <Stat label="Active today" value={t.active_today} />
          <Stat label="Active this week" value={t.active_week} />
          <Stat label="Messages" value={t.total_messages} />
          <Stat label="Premium" value={(data.tiers.find((x) => x.tier === "consistency_builder")?.n) || 0} />
        </div>

        {/* charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="New patients (14 days)"><BarChart data={data.signups} color="#0891B2" /></Panel>
          <Panel title="Messages / day (14 days)"><BarChart data={data.messages} color="#059669" /></Panel>
          <Panel title="Avg glucose / day"><LineChart data={data.glucoseByDay.map((d) => ({ value_mgdl: d.avg }))} /></Panel>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Diabetes status"><Donut data={data.statuses} labelKey="status" /></Panel>
          <Panel title="Plan breakdown"><Donut data={data.tiers} labelKey="tier" /></Panel>
        </div>

        {/* patient table */}
        <Panel title={`Patients (${data.patients.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line/60 text-[11px] uppercase tracking-wider text-ink/40">
                  <th className="py-2 pr-3">Name</th>
                  <th className="px-3">Age</th>
                  <th className="px-3">City</th>
                  <th className="px-3">Diabetes</th>
                  <th className="px-3">Lang</th>
                  <th className="px-3">Plan</th>
                  <th className="px-3">Streak</th>
                  <th className="px-3">Avg sugar</th>
                  <th className="px-3">Msgs</th>
                  <th className="px-3">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className="cursor-pointer border-b border-line/40 hover:bg-muted/50"
                  >
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
      </div>

      {selected && <PatientDrawer id={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
