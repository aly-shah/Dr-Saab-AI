"use client";

// Lightweight dependency-free SVG charts for the admin dashboard.

export function BarChart({ data, valueKey = "n", labelKey = "day", color = "#0891B2", height = 160 }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  const w = Math.max(data.length * 26, 200);
  const bw = w / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const bh = (v / max) * (height - 26);
        return (
          <g key={i}>
            <rect
              x={i * bw + bw * 0.18}
              y={height - 18 - bh}
              width={bw * 0.64}
              height={bh}
              rx="3"
              fill={color}
              opacity={0.85}
            />
            {i % 2 === 0 && (
              <text x={i * bw + bw / 2} y={height - 5} textAnchor="middle" fontSize="8" fill="#94a3b8">
                {d[labelKey]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, valueKey = "value_mgdl", height = 170, band = [80, 130] }) {
  const vals = data.map((d) => Number(d[valueKey])).filter((n) => !Number.isNaN(n));
  if (!vals.length) return <div className="grid h-40 place-items-center text-sm text-ink/40">No data</div>;
  const min = Math.min(...vals, band[0]) - 10;
  const max = Math.max(...vals, band[1]) + 10;
  const w = 320;
  const h = height;
  const stepX = w / Math.max(1, data.length - 1);
  const y = (v) => h - ((v - min) / (max - min)) * h;
  const pts = data.map((d, i) => [i * stepX, y(Number(d[valueKey]))]);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ height }}>
      <defs>
        <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0891B2" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y={y(band[1])} width={w} height={Math.max(0, y(band[0]) - y(band[1]))} fill="#05966910" />
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#adminFill)" />
      <path d={line} fill="none" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, yy], i) => (
        <circle key={i} cx={x} cy={yy} r="2.6" fill="#fff" stroke="#0891B2" strokeWidth="1.6" />
      ))}
    </svg>
  );
}

const DONUT_COLORS = ["#0891B2", "#059669", "#22D3EE", "#F59E0B", "#6366F1", "#EC4899", "#94A3B8"];

export function Donut({ data, valueKey = "n", labelKey = "status" }) {
  const total = Math.max(1, data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0));
  let acc = 0;
  const r = 52;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8F1F6" strokeWidth="14" />
        {data.map((d, i) => {
          const v = Number(d[valueKey]) || 0;
          const frac = v / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acc * circ}
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-ink/70">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="capitalize">{d[labelKey]}</span>
            <span className="font-semibold text-ink">{d[valueKey]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
