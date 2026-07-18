import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { NODES, EDGES, nodeMap, CHAOS_IMPACT, edgePath } from "../../data/topology.js";
import GraphNode from "./GraphNode.jsx";

export default function ArchitectureGraph({ chaos }) {
  const impacted = useMemo(() => {
    const nodes = new Set();
    const edges = new Set();
    Object.entries(chaos).forEach(([key, on]) => {
      if (!on) return;
      CHAOS_IMPACT[key].nodes.forEach((n) => nodes.add(n));
      CHAOS_IMPACT[key].edges.forEach((e) => edges.add(e));
    });
    return { nodes, edges };
  }, [chaos]);

  const anyChaos = chaos.rateLimit || chaos.latency || chaos.outage;
  const pulseDur = chaos.latency ? "3.6s" : "1.6s";

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 800 520" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="edge-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--cyan)" stopOpacity="0.65" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="edge-rose" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--rose)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--rose)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--rose)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* base edges + animated pulses */}
        {EDGES.map((e) => {
          const isBad = impacted.edges.has(e.id);
          const d = edgePath(e.from, e.to, e.curve);
          return (
            <g key={e.id}>
              <path
                d={d}
                fill="none"
                stroke={isBad ? "url(#edge-rose)" : "url(#edge-cyan)"}
                strokeWidth={isBad ? 1.6 : 1.4}
                strokeDasharray={isBad ? "3 5" : "0"}
              />
              {[0, 1, 2].map((i) => (
                <circle key={i} r={isBad ? 2.6 : 3} fill={isBad ? "var(--rose)" : "var(--cyan)"}>
                  <animateMotion
                    dur={pulseDur}
                    begin={`${i * (parseFloat(pulseDur) / 3)}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur={pulseDur}
                    begin={`${i * (parseFloat(pulseDur) / 3)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          );
        })}

        {NODES.map((n) => (
          <GraphNode
            key={n.id}
            node={n}
            degraded={impacted.nodes.has(n.id)}
            isDown={chaos.outage && (n.id === "coder" || n.id === "reviewer")}
          />
        ))}

        {/* status badges */}
        {chaos.rateLimit && (
          <foreignObject x={nodeMap.gateway.x - 34} y={nodeMap.gateway.y - 78} width={90} height={26}>
            <div className="hm-badge-pop px-2 py-0.5 rounded-full text-[9px] font-semibold hm-mono text-center border border-[var(--border-med)] text-[var(--rose)] bg-[var(--panel)] whitespace-nowrap">
              429 LIMIT
            </div>
          </foreignObject>
        )}
        {chaos.outage && (
          <foreignObject x={nodeMap.orchestrator.x - 62} y={nodeMap.orchestrator.y - 96} width={130} height={26}>
            <div className="hm-badge-pop px-2 py-0.5 rounded-full text-[9px] font-semibold hm-mono text-center border border-[var(--border-med)] text-[var(--rose)] bg-[var(--panel)] whitespace-nowrap">
              CIRCUIT BREAKER OPEN
            </div>
          </foreignObject>
        )}
        {chaos.latency && (
          <foreignObject x={nodeMap.redis.x - 46} y={nodeMap.redis.y - 78} width={110} height={26}>
            <div className="hm-badge-pop px-2 py-0.5 rounded-full text-[9px] font-semibold hm-mono text-center border border-[var(--border-med)] text-[var(--amber)] bg-[var(--panel)] whitespace-nowrap">
              HIGH LATENCY
            </div>
          </foreignObject>
        )}
      </svg>

      {anyChaos && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border-med)] bg-[var(--panel)] text-[var(--rose)] text-[10px] font-semibold hm-mono">
          <AlertTriangle size={11} />
          DEGRADED
        </div>
      )}
    </div>
  );
}
