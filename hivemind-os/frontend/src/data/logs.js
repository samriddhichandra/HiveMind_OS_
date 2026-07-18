const LOG_TEMPLATES = [
  { tag: "RAG", level: "info", make: () => `Context retrieved · ${(Math.random() * 4 + 1).toFixed(2)}k tokens · top_k=${Math.floor(Math.random() * 6) + 4}` },
  { tag: "VECTOR", level: "info", make: () => `Semantic search · cosine=${(0.7 + Math.random() * 0.29).toFixed(3)} · ns="prod-embeddings"` },
  { tag: "CQRS", level: "success", make: () => `Event dispatched · AgentTaskCompleted · seq=${Math.floor(Math.random() * 90000)}` },
  { tag: "CACHE", level: "success", make: () => `Cache hit · key=session:${Math.random().toString(16).slice(2, 8)}` },
  { tag: "SWARM", level: "info", make: () => `Orchestrator → ${Math.random() > 0.5 ? "Coder" : "Reviewer"} · task delegated` },
  { tag: "K8S", level: "info", make: () => `HPA scan · cpu=${Math.floor(Math.random() * 30) + 55}% · replicas stable` },
];

const CHAOS_LOG_TEMPLATES = {
  rateLimit: [
    { tag: "GATEWAY", level: "error", make: () => `429 Too Many Requests · route=/v1/agents/dispatch` },
    { tag: "GATEWAY", level: "warn", make: () => `Backoff scheduled · retry_after=${Math.floor(Math.random() * 4) + 1}s` },
  ],
  latency: [
    { tag: "CACHE", level: "warn", make: () => `Cache miss · latency=${Math.floor(Math.random() * 700) + 400}ms` },
    { tag: "KAFKA", level: "warn", make: () => `Consumer lag rising · partition=${Math.floor(Math.random() * 6)}` },
  ],
  outage: [
    { tag: "AGENT", level: "error", make: () => `Provider unreachable · openai.chat.completions` },
    { tag: "AGENT", level: "warn", make: () => `Agent retry · attempt=${Math.floor(Math.random() * 3) + 1}/3 · backend=fallback-llm` },
    { tag: "SWARM", level: "error", make: () => `Circuit breaker OPEN · Orchestrator↔ProviderPool` },
  ],
};

export const LEVEL_STYLE = {
  info: "text-[var(--cyan)]",
  success: "text-[var(--emerald)]",
  warn: "text-[var(--amber)]",
  error: "text-[var(--rose)]",
};

let logId = 0;

export function makeLogEntry(chaos) {
  const activeChaosKeys = Object.keys(chaos).filter((k) => chaos[k]);
  const useChaos = activeChaosKeys.length > 0 && Math.random() < 0.55;

  let pool = LOG_TEMPLATES;
  if (useChaos) {
    const key = activeChaosKeys[Math.floor(Math.random() * activeChaosKeys.length)];
    pool = CHAOS_LOG_TEMPLATES[key];
  }

  const tpl = pool[Math.floor(Math.random() * pool.length)];
  logId += 1;
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
  return { id: logId, time, tag: tpl.tag, level: tpl.level, message: tpl.make() };
}

// Convert backend WebSocket events to log entries
export function eventToLogEntry(event) {
  if (!event) return null;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
  logId += 1;

  const status = event.status;
  const node = event.node;

  // Map backend event statuses to log format
  const statusMap = {
    HIT: { tag: "CACHE", level: "success", message: `Cache hit · key=${event.key || "session"} · ${event.latency || ""}` },
    MISS: { tag: "CACHE", level: "warn", message: `Cache miss · key=${event.key || "session"} · ${event.latency || ""}` },
    RAG_FETCH: { tag: "RAG", level: "info", message: `Context retrieved · ${event.tokens || 0} tokens · query="${event.query || ""}"` },
    THINKING: { tag: "SWARM", level: "info", message: `${node} thinking · ${event.prompt_tokens || 0} tokens · model=${event.model || "llama3"}` },
    PLANNING: { tag: "SWARM", level: "info", message: `${node} planning · task="${event.task || ""}"` },
    WORKING: { tag: "SWARM", level: "info", message: `${node} working · ${event.output_tokens || 0} tokens · ${event.latency || ""}` },
    REVIEWING: { tag: "SWARM", level: "info", message: `${node} reviewing · ${event.count || 0} subtasks` },
    APPROVED: { tag: "CQRS", level: "success", message: `${node} approved · score=${event.score || 0}` },
    REJECTED: { tag: "CQRS", level: "error", message: `${node} rejected · score=${event.score || 0}` },
    RATE_LIMITED: { tag: "GATEWAY", level: "error", message: `${node} rate limited · ${event.message || "429 Too Many Requests"}` },
    LLM_DOWN: { tag: "AGENT", level: "error", message: `${node} LLM down · ${event.error || ""}` },
    FALLBACK: { tag: "SWARM", level: "warn", message: `${node} fallback activated · ${event.message || ""}` },
    CIRCUIT_OPEN: { tag: "SWARM", level: "error", message: `${node} circuit open · ${event.message || ""}` },
    RETRY: { tag: "GATEWAY", level: "warn", message: `${node} retry · subtask="${event.subtask || ""}"` },
    COMPLETE: { tag: "CQRS", level: "success", message: `${node} complete · approved=${event.approved} · ${event.subtasks_completed || 0} subtasks` },
    ERROR: { tag: "SYSTEM", level: "error", message: `Error · ${event.error || ""}` },
    SESSION_START: { tag: "SYSTEM", level: "info", message: `Session started · task="${event.task || ""}" · loops=${event.loops || 1}` },
    LOOP_START: { tag: "SYSTEM", level: "info", message: `Loop ${event.loop || 1}/${event.of || 1} started` },
    SESSION_END: { tag: "SYSTEM", level: "info", message: "Session ended" },
  };

  const mapped = statusMap[status];
  if (!mapped) return null;

  return {
    id: logId,
    time,
    tag: mapped.tag,
    level: mapped.level,
    message: mapped.message,
  };
}
