import Link from "next/link";

export function ErrorBanner({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{msg}</div>;
}

export function StatusChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="chip text-white" style={{ background: color }}>
      {name}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-black/55">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "bad" | "good" | "warn" }) {
  const c = tone === "bad" ? "text-red-600" : tone === "good" ? "text-green-600" : tone === "warn" ? "text-amber-600" : "text-ink";
  return (
    <div className="card px-4 py-3">
      <p className={`text-2xl font-extrabold ${c}`}>{value}</p>
      <p className="text-xs font-medium text-black/50">{label}</p>
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400" title={`${n} de 5`}>
      {"★".repeat(n)}
      <span className="text-black/15">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function Tabs({ base, current, items }: { base: string; current: string; items: { key: string; label: string; count?: number }[] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-black/10">
      {items.map((t) => (
        <Link key={t.key} href={`${base}?aba=${t.key}`} className={current === t.key ? "tab-on" : "tab"}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-black/5 px-1.5 text-xs">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-black/45">{children}</p>;
}
