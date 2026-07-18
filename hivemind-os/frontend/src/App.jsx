import { useCallback, useState, useEffect } from "react";
import { Network } from "lucide-react";

import { useInterval } from "./hooks/useInterval.js";
import { clamp, randWalk } from "./utils/helpers.js";
import { makeLogEntry, eventToLogEntry } from "./data/logs.js";

import Header from "./components/Header.jsx";
import GlassPanel from "./components/GlassPanel.jsx";
import SectionLabel from "./components/SectionLabel.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import ArchitectureGraph from "./components/ArchitectureGraph/ArchitectureGraph.jsx";
import LiveTerminal from "./components/LiveTerminal.jsx";
import { useWebSocket } from "./hooks/useWebSocket.js";

export default function App() {
  const [chaos, setChaos] = useState({ rateLimit: false, latency: false, outage: false });
  const [userTask, setUserTask] = useState("Design a scalable chat notification system");
  const [loops, setLoops] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const [tokensPerSec, setTokensPerSec] = useState(1840);
  const [cacheHit, setCacheHit] = useState(94.2);
  const [sockets, setSockets] = useState(312);
  const [pods, setPods] = useState(6);

  const [tokHist, setTokHist] = useState(Array(20).fill(1840));
  const [cacheHist, setCacheHist] = useState(Array(20).fill(94.2));
  const [sockHist, setSockHist] = useState(Array(20).fill(312));
  const [podHist, setPodHist] = useState(Array(20).fill(6));

  const [logs, setLogs] = useState(() =>
    Array.from({ length: 8 }, () => makeLogEntry({ rateLimit: false, latency: false, outage: false }))
  );

  // WebSocket connection for real-time events
  const { events, connected, error } = useWebSocket(isSimulating ? userTask : null, loops);

  // Process incoming WebSocket events and convert to logs
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      const logEntry = eventToLogEntry(lastEvent);
      if (logEntry) {
        setLogs((prev) => {
          const next = [...prev, logEntry];
          return next.length > 60 ? next.slice(next.length - 60) : next;
        });
      }
    }
  }, [events]);

  // Update chaos state based on backend events
  useEffect(() => {
    events.forEach((event) => {
      if (event.status === "RATE_LIMITED") {
        setChaos((c) => ({ ...c, rateLimit: true }));
      } else if (event.status === "CIRCUIT_OPEN") {
        setChaos((c) => ({ ...c, outage: true }));
      } else if (event.status === "LLM_DOWN") {
        setChaos((c) => ({ ...c, outage: true }));
      }
    });
  }, [events]);

  const toggleChaos = useCallback((key) => {
    setChaos((c) => ({ ...c, [key]: !c[key] }));
  }, []);

  // Trigger chaos on backend
  const triggerBackendChaos = useCallback(async (type, seconds = 10) => {
    try {
      const endpoint = type === "rateLimit" ? "/trigger-rate-limit" : "/fail-llm";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
      });
    } catch (e) {
      console.error("Failed to trigger chaos:", e);
    }
  }, []);

  // Reset chaos on backend
  const resetBackendChaos = useCallback(async () => {
    try {
      await fetch("/reset-chaos", { method: "POST" });
    } catch (e) {
      console.error("Failed to reset chaos:", e);
    }
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    setLogs([]);
    setIsSimulating(true);
  }, []);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  // metrics tick
  useInterval(() => {
    setTokensPerSec((v) => {
      const base = chaos.outage ? randWalk(v, 200, 900, 140) : randWalk(v, 1400, 2600, 180);
      return Math.round(base);
    });
    setCacheHit((v) => {
      const base = chaos.latency ? randWalk(v, 55, 78, 4) : randWalk(v, 91, 97, 1.2);
      return clamp(base, 40, 99);
    });
    setSockets((v) => {
      const base = chaos.rateLimit ? randWalk(v, 60, 180, 20) : randWalk(v, 260, 380, 16);
      return Math.round(base);
    });
    setPods((v) => {
      const target = chaos.outage || chaos.rateLimit ? 11 : 6;
      const next = v + (target > v ? 1 : target < v ? -1 : 0) * (Math.random() > 0.4 ? 1 : 0);
      return clamp(Math.round(next), 4, 14);
    });
  }, 1400);

  // history push
  useInterval(() => {
    setTokHist((h) => [...h.slice(1), tokensPerSec]);
    setCacheHist((h) => [...h.slice(1), cacheHit]);
    setSockHist((h) => [...h.slice(1), sockets]);
    setPodHist((h) => [...h.slice(1), pods]);
  }, 1400);

  // log stream - speeds up under chaos
  const logInterval = chaos.outage || chaos.rateLimit || chaos.latency ? 650 : 1100;
  useInterval(() => {
    setLogs((prev) => {
      const next = [...prev, makeLogEntry(chaos)];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, logInterval);

  const healthy = !chaos.rateLimit && !chaos.latency && !chaos.outage;

  return (
    <div className="hm-root min-h-screen w-full bg-[var(--bg-void)] text-[var(--ink-100)] relative overflow-hidden">
       {/* ambient background */}
       <div className="hm-noise-grid absolute inset-0 opacity-40 pointer-events-none" />
       <div
         className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full pointer-events-none"
         style={{ background: "radial-gradient(circle, var(--cyan-dim), transparent 70%)" }}
       />
       <div
         className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
         style={{ background: "radial-gradient(circle, var(--emerald-dim), transparent 70%)" }}
       />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4 min-h-screen">
        <Header healthy={healthy} connected={connected} isSimulating={isSimulating} 
                userTask={userTask} loops={loops}
                onStart={startSimulation} onStop={stopSimulation}
                onTaskChange={setUserTask} onLoopsChange={setLoops} />

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-4 flex-1 min-h-0">
          <LeftSidebar
            metrics={{ tokensPerSec, cacheHit, sockets, pods }}
            history={{ tokHist, cacheHist, sockHist, podHist }}
          />

          <GlassPanel className="flex flex-col min-h-[420px]">
            <SectionLabel icon={Network} right={<span className="text-[10px] hm-mono text-[var(--ink-500)]">7 nodes · 7 links</span>}>
              Architecture Graph
            </SectionLabel>
            <div className="flex-1 px-2 pb-3">
              <ArchitectureGraph chaos={chaos} />
            </div>
          </GlassPanel>

          <RightSidebar chaos={chaos} onToggle={toggleChaos} onTriggerBackend={triggerBackendChaos} onReset={resetBackendChaos} />
        </div>

        <div className="h-[190px] shrink-0">
          <LiveTerminal logs={logs} />
        </div>
      </div>
    </div>
  );
}