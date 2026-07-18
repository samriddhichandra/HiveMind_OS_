import { useState } from "react";
import { Boxes, Clock3, CircleDot, Play, Square, Send, Sun, Moon } from "lucide-react";
import { useInterval } from "../hooks/useInterval.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Header({ healthy, connected, isSimulating, userTask, loops, onStart, onStop, onTaskChange, onLoopsChange }) {
  const [now, setNow] = useState(new Date());
  const [taskInput, setTaskInput] = useState(userTask);
  const [loopsInput, setLoopsInput] = useState(loops);
  const { theme, toggleTheme } = useTheme();

  useInterval(() => setNow(new Date()), 1000);

  const handleStart = () => {
    onTaskChange(taskInput);
    onLoopsChange(loopsInput);
    onStart();
  };

  return (
    <div className="flex items-center justify-between px-1 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--cyan)] to-[var(--emerald)] flex items-center justify-center shadow-[0_0_24px_-4px_var(--cyan-dim)]">
          <Boxes size={18} strokeWidth={2.2} className="text-[#05070a]" />
        </div>
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--ink-100)] tracking-tight leading-none">HiveMind OS</h1>
          <p className="text-[11px] text-[var(--ink-500)] mt-1 hm-mono">distributed swarm control plane</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-[var(--ink-500)] text-[11px] hm-mono">
          <Clock3 size={12} />
          {now.toLocaleTimeString("en-US", { hour12: false })}
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold hm-mono ${
            healthy
              ? "border-[rgba(52,227,161,0.35)] bg-[rgba(52,227,161,0.08)] text-[var(--emerald)]"
              : "border-[rgba(251,111,140,0.35)] bg-[rgba(251,111,140,0.08)] text-[var(--rose)]"
          }`}
        >
          <CircleDot size={11} />
          {healthy ? "SYSTEM NOMINAL" : "SYSTEM DEGRADED"}
        </div>
        
         {/* Theme Toggle */}
         <button
           onClick={toggleTheme}
           className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--panel-solid)] border border-[var(--border-soft)] text-[var(--ink-300)] hover:text-[var(--ink-100)] hover:bg-[var(--border-soft)] transition-all"
           title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
         >
           {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
         </button>
        
        {/* Simulation Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[var(--ink-500)] text-[11px] hm-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[var(--emerald)]" : "bg-[var(--ink-500)]"}`} />
            {connected ? "WS CONNECTED" : "WS DISCONNECTED"}
          </div>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Enter task..."
            className="hidden sm:block w-48 px-2 py-1 text-[11px] hm-mono rounded bg-[var(--panel-solid)] border border-[var(--border-soft)] text-[var(--ink-100)] placeholder-[var(--ink-500)]"
          />
          <input
            type="number"
            value={loopsInput}
            onChange={(e) => setLoopsInput(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="w-12 px-1 py-1 text-[11px] hm-mono rounded bg-[var(--panel-solid)] border border-[var(--border-soft)] text-[var(--ink-100)]"
          />
          {!isSimulating ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold hm-mono rounded bg-[var(--cyan)] text-[#05070a] hover:opacity-90 transition-opacity"
            >
              <Play size={12} />
              Start
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold hm-mono rounded bg-[var(--rose)] text-white hover:opacity-90 transition-opacity"
            >
              <Square size={12} />
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}