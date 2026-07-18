import { Network, Zap, Radio, Cpu, Code2, ShieldCheck, Layers3 } from "lucide-react";

export const NODES = [
  { id: "gateway", label: "API Gateway", sub: "edge · ingress", icon: Network, x: 118, y: 108, accent: "cyan" },
  { id: "redis", label: "Redis Cache", sub: "in-memory store", icon: Zap, x: 118, y: 262, accent: "emerald" },
  { id: "kafka", label: "Kafka", sub: "event stream", icon: Radio, x: 118, y: 416, accent: "cyan" },
  { id: "orchestrator", label: "Orchestrator", sub: "swarm control", icon: Cpu, x: 404, y: 262, accent: "emerald", hub: true },
  { id: "coder", label: "Coder Agent", sub: "codegen", icon: Code2, x: 690, y: 122, accent: "cyan" },
  { id: "reviewer", label: "Reviewer Agent", sub: "critique loop", icon: ShieldCheck, x: 690, y: 262, accent: "emerald" },
  { id: "vectordb", label: "Vector DB", sub: "embeddings", icon: Layers3, x: 690, y: 416, accent: "cyan" },
];

export const EDGES = [
  { from: "gateway", to: "orchestrator", id: "e-gw" },
  { from: "redis", to: "orchestrator", id: "e-redis" },
  { from: "kafka", to: "orchestrator", id: "e-kafka" },
  { from: "orchestrator", to: "coder", id: "e-coder" },
  { from: "orchestrator", to: "reviewer", id: "e-reviewer" },
  { from: "orchestrator", to: "vectordb", id: "e-vector" },
  { from: "coder", to: "reviewer", id: "e-loop", curve: true },
];

export const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

// which edges/nodes are impacted by each chaos toggle
export const CHAOS_IMPACT = {
  rateLimit: { nodes: ["gateway"], edges: ["e-gw"] },
  latency: { nodes: ["redis", "kafka"], edges: ["e-redis", "e-kafka"] },
  outage: { nodes: ["coder", "reviewer", "vectordb"], edges: ["e-coder", "e-reviewer", "e-vector", "e-loop"] },
};

export function edgePath(from, to, curve) {
  const a = nodeMap[from];
  const b = nodeMap[to];
  if (curve) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + 46;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  }
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}
