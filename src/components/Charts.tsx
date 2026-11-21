'use client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

const fmt = (v: number) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));
const tip = { contentStyle: { background: 'rgb(var(--panel))', border: '1px solid rgb(var(--line))', borderRadius: 12, color: 'rgb(var(--ink))' } };

export function LinesChart({ data, lines, height = 280 }: { data: Record<string, string | number>[]; lines: { key: string; name: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
        <XAxis dataKey="label" stroke="rgb(var(--muted))" fontSize={12} />
        <YAxis stroke="rgb(var(--muted))" fontSize={12} tickFormatter={fmt} width={48} />
        <Tooltip {...tip} formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
        <Legend />
        {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, center, height = 240 }: { data: { name: string; value: number; color: string }[]; center?: string; height?: number }) {
  const has = data.some((d) => d.value > 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={has ? data : [{ name: 'None', value: 1, color: 'rgb(var(--line))' }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={has ? 2 : 0} stroke="none">
            {(has ? data : [{ color: 'rgb(var(--line))' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          {has && <Tooltip {...tip} />}
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold">{center}</span><span className="text-xs text-muted">Total</span></div>}
    </div>
  );
}
