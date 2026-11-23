'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// 12,500 → "12.5k" (not "13k"), 1,500 → "1.5k".
const fmt = (v: number) => (v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));
const rupees = (v: number) => `PKR ${Number(v).toLocaleString('en-PK')}`;
const AXIS = { stroke: 'rgb(var(--muted))', fontSize: 12, fontFamily: 'var(--font-mono)', tickLine: false, axisLine: false } as const;
const tip = {
  contentStyle: { background: 'rgb(var(--panel))', border: '1px solid rgb(var(--line))', borderRadius: 10, color: 'rgb(var(--ink))', boxShadow: '0 8px 24px rgba(16,24,40,0.08)', fontSize: 13 },
  labelStyle: { color: 'rgb(var(--ink2))', marginBottom: 4 },
  cursor: { stroke: 'rgb(var(--line))', strokeWidth: 1 },
};

/** One accent line (the first) over a muted grid; extra lines render in neutral steps. */
export function LinesChart({ data, lines, height = 300, title = 'Chart' }: { data: Record<string, string | number>[]; lines: { key: string; name: string; color: string }[]; height?: number; title?: string }) {
  return (
    <figure role="group" aria-label={title}>
      {/* Screen readers get the numbers as a table; the drawn chart is hover-only. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th scope="col">Period</th>{lines.map((l) => <th key={l.key} scope="col">{l.name}</th>)}</tr></thead>
        <tbody>{data.map((row, r) => <tr key={r}><th scope="row">{String(row.label ?? r)}</th>{lines.map((l) => <td key={l.key}>{rupees(Number(row[l.key] ?? 0))}</td>)}</tr>)}</tbody>
      </table>
      <div aria-hidden>
      {lines.length > 1 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-2 pb-2 text-[13px] text-ink2">
          {lines.map((l, i) => (
            <span key={l.key} className="inline-flex items-center gap-2">
              <span className={`w-4 ${i === 0 ? 'h-0.5 rounded-full bg-navy' : 'border-t-2 border-dashed border-muted'}`} />
              {l.name}
            </span>
          ))}
        </div>
      )}
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="area-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B2A5B" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#0B2A5B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
        <XAxis dataKey="label" {...AXIS} dy={8} />
        <YAxis {...AXIS} tickFormatter={fmt} width={44} />
        <Tooltip {...tip} formatter={(v: number) => rupees(v)} />
        {lines.map((l, i) => (
          <Area
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={i === 0 ? '#0B2A5B' : 'rgb(var(--muted))'}
            strokeWidth={i === 0 ? 2 : 1.5}
            strokeDasharray={i === 0 ? undefined : '4 4'}
            fill={i === 0 ? 'url(#area-accent)' : 'none'}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: i === 0 ? '#0B2A5B' : 'rgb(var(--muted))' }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function Donut({ data, center, height = 220 }: { data: { name: string; value: number; color: string }[]; center?: string; height?: number }) {
  const has = data.some((d) => d.value > 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={has ? data : [{ name: 'None', value: 1, color: 'rgb(var(--line))' }]} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="92%" paddingAngle={has ? 1.5 : 0} stroke="#fff" strokeWidth={has ? 1 : 0} startAngle={90} endAngle={-270}>
            {(has ? data : [{ color: 'rgb(var(--line))' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          {has && <Tooltip {...tip} formatter={(v: number) => v.toLocaleString('en-PK')} />}
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[28px] font-medium tabular-nums text-ink">{center}</span>
          <span className="text-[13px] text-muted">cars</span>
        </div>
      )}
    </div>
  );
}
