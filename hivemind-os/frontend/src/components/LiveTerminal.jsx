import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import GlassPanel from "./GlassPanel.jsx";
import { LEVEL_STYLE } from "../data/logs.js";

export default function LiveTerminal({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <GlassPanel className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-soft)] shrink-0">
        <div className="flex items-center gap-2 text-[var(--ink-300)]">
          <Terminal size={14} strokeWidth={2.25} />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">Live Event Stream</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] hm-mono text-[var(--emerald)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] animate-pulse" />
          streaming
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto hm-scrollbar px-5 py-2.5 space-y-[3px]">
        {logs.map((l) => (
          <div key={l.id} className="hm-log-enter flex items-baseline gap-2.5 text-[12px] hm-mono leading-relaxed">
            <span className="text-[var(--ink-500)] shrink-0">{l.time}</span>
            <span className={`shrink-0 w-16 ${LEVEL_STYLE[l.level]} font-semibold`}>[{l.tag}]</span>
            <span className="text-[var(--ink-300)] truncate">{l.message}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
