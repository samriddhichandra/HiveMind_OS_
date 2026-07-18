import { TrendingUp, TrendingDown } from "lucide-react";
import Sparkline from "./Sparkline.jsx";

export default function MetricCard({ icon: Icon, label, value, unit, accent, history, trend }) {
  const colorVar = `var(--${accent})`;
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--panel-solid)] px-4 py-3.5 hover:border-[var(--border-med)] transition-colors duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${colorVar} 16%, transparent)`, color: colorVar }}
          >
            <Icon size={14} strokeWidth={2.25} />
          </div>
          <span className="text-[12px] text-[var(--ink-300)] font-medium">{label}</span>
        </div>
        <span
          className={`flex items-center gap-0.5 text-[10px] hm-mono ${
            trend >= 0 ? "text-[var(--emerald)]" : "text-[var(--rose)]"
          }`}
        >
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="hm-mono text-[26px] leading-none font-semibold text-[var(--ink-100)] tabular-nums">
          {value}
        </span>
        <span className="hm-mono text-[12px] text-[var(--ink-500)]">{unit}</span>
      </div>
      <Sparkline data={history} color={colorVar} />
    </div>
  );
}
