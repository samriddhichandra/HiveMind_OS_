import { Gauge, Zap, Activity, Wifi, Boxes } from "lucide-react";
import GlassPanel from "./GlassPanel.jsx";
import SectionLabel from "./SectionLabel.jsx";
import MetricCard from "./MetricCard.jsx";

export default function LeftSidebar({ metrics, history }) {
  const { tokensPerSec, cacheHit, sockets, pods } = metrics;
  const { tokHist, cacheHist, sockHist, podHist } = history;

  return (
    <GlassPanel className="flex flex-col">
      <SectionLabel icon={Gauge}>Live Metrics</SectionLabel>
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        <MetricCard
          icon={Zap}
          label="Tokens / sec"
          value={tokensPerSec.toLocaleString()}
          unit="tok/s"
          accent="cyan"
          history={tokHist}
          trend={((tokensPerSec - tokHist[0]) / tokHist[0]) * 100}
        />
        <MetricCard
          icon={Activity}
          label="Cache Hit Rate"
          value={cacheHit.toFixed(1)}
          unit="%"
          accent="emerald"
          history={cacheHist}
          trend={((cacheHit - cacheHist[0]) / cacheHist[0]) * 100}
        />
        <MetricCard
          icon={Wifi}
          label="Active WebSockets"
          value={sockets.toLocaleString()}
          unit="conns"
          accent="cyan"
          history={sockHist}
          trend={((sockets - sockHist[0]) / sockHist[0]) * 100}
        />
        <MetricCard
          icon={Boxes}
          label="K8s Pod Replicas"
          value={pods}
          unit="pods"
          accent="emerald"
          history={podHist}
          trend={((pods - podHist[0]) / (podHist[0] || 1)) * 100}
        />
        <div className="flex items-center gap-2 text-[10px] text-[var(--ink-500)] hm-mono px-1 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] animate-pulse" />
          autoscaler: {pods > 6 ? "scaling up" : "steady state"}
        </div>
      </div>
    </GlassPanel>
  );
}
