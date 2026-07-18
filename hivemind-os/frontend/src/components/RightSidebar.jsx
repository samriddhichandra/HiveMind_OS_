import { ShieldAlert, AlertTriangle, Wifi, Power, RefreshCw } from "lucide-react";
import GlassPanel from "./GlassPanel.jsx";
import SectionLabel from "./SectionLabel.jsx";
import ChaosToggle from "./ChaosToggle.jsx";

export default function RightSidebar({ chaos, onToggle, onTriggerBackend, onReset }) {
  return (
    <GlassPanel className="flex flex-col">
      <SectionLabel icon={ShieldAlert}>Chaos Monkey</SectionLabel>
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        <ChaosToggle
          icon={AlertTriangle}
          label="Trigger 429 Rate Limit"
          description="Saturate the API Gateway with excess requests."
          active={chaos.rateLimit}
          onToggle={() => onToggle("rateLimit")}
          onTriggerBackend={() => onTriggerBackend("rateLimit")}
          accent="rose"
        />
        <ChaosToggle
          icon={Wifi}
          label="Inject Network Latency"
          description="Slow down Redis and Kafka round-trips."
          active={chaos.latency}
          onToggle={() => onToggle("latency")}
          onTriggerBackend={null}
          accent="amber"
        />
        <ChaosToggle
          icon={Power}
          label="Simulate OpenAI Outage"
          description="Trip the circuit breaker on the agent swarm."
          active={chaos.outage}
          onToggle={() => onToggle("outage")}
          onTriggerBackend={() => onTriggerBackend("outage")}
          accent="rose"
        />
        <button
           onClick={onReset}
           className="mt-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--panel-solid)] text-[11px] font-semibold hm-mono text-[var(--ink-300)] hover:bg-[var(--panel)] transition-colors"
         >
           <RefreshCw size={12} />
           Reset All Chaos
         </button>
         <div className="mt-1 rounded-xl border border-[var(--border-soft)] bg-[var(--panel-solid)] px-3.5 py-3 text-[11px] text-[var(--ink-500)] leading-relaxed">
           Toggles simulate real failure modes and drive the graph, metrics, and event stream in real time — a safe sandbox for testing resilience.
         </div>
      </div>
    </GlassPanel>
  );
}