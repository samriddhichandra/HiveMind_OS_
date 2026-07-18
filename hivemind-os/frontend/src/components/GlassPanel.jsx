import { useTheme } from "../context/ThemeContext.jsx";

export default function GlassPanel({ children, className = "" }) {
  const { theme } = useTheme();
  
  return (
    <div
      className={`rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] backdrop-blur-xl ${className}`}
      style={{
        boxShadow: theme === "light" 
          ? "0 0 0 1px rgba(0,0,0,0.04), 0 20px 50px -20px rgba(0,0,0,0.15)"
          : "0 0 0 1px rgba(255,255,255,0.02), 0 20px 50px -20px rgba(0,0,0,0.6)"
      }}
    >
      {children}
    </div>
  );
}