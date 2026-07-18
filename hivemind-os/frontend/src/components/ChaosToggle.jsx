export default function ChaosToggle({ icon: Icon, label, description, active, onToggle, onTriggerBackend, accent }) {
  const colorVar = `var(--${accent})`;
  
  const handleClick = () => {
    onToggle();
    if (onTriggerBackend) {
      onTriggerBackend();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-300 group ${
        active
          ? "border-[var(--border-med)] bg-[var(--panel)]"
          : "border-[var(--border-soft)] bg-[var(--panel-solid)] hover:bg-[var(--panel)]"
      }`}
      style={active ? { boxShadow: `0 0 0 1px ${colorVar}33, 0 0 24px -6px ${colorVar}55` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-300"
            style={{
              background: active ? `color-mix(in srgb, ${colorVar} 18%, transparent)` : "var(--panel)",
              color: active ? colorVar : "var(--ink-500)",
            }}
          >
            <Icon size={14} strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[var(--ink-100)]">{label}</div>
            <div className="text-[11px] text-[var(--ink-500)] mt-0.5 leading-snug">{description}</div>
          </div>
        </div>
        <span
          className="hm-switch-track relative inline-flex h-5 w-9 shrink-0 rounded-full mt-0.5"
          style={{
            background: active ? colorVar : "var(--border-med)",
            boxShadow: active ? `0 0 10px -2px ${colorVar}` : "none",
          }}
        >
          <span
            className="hm-switch-thumb absolute top-0.5 left-0.5 h-4 w-4 rounded-full"
            style={{ 
              transform: active ? "translateX(16px)" : "translateX(0)",
              backgroundColor: "var(--panel-solid)"
            }}
          />
        </span>
      </div>
    </button>
  );
}