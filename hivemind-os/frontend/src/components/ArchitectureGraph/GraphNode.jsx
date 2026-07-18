export default function GraphNode({ node, degraded, isDown }) {
  const Icon = node.icon;
  const colorVar = degraded ? "var(--rose)" : `var(--${node.accent})`;
  const size = node.hub ? 96 : 84;

  return (
    <g transform={`translate(${node.x - size / 2}, ${node.y - size / 2})`}>
      <foreignObject width={size} height={size} style={{ overflow: "visible" }}>
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`relative rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-md transition-colors duration-500 ${
              node.hub ? "w-[92px] h-[92px]" : "w-[80px] h-[80px]"
            }`}
             style={{
               background: "var(--panel)",
               borderColor: degraded ? "rgba(251,111,140,0.55)" : "var(--border-med)",
               boxShadow: degraded
                 ? `0 0 0 1px rgba(251,111,140,0.25), 0 0 30px -6px ${colorVar}`
                 : `0 0 0 1px var(--border-soft), 0 0 26px -10px ${colorVar}`,
             }}
          >
            <div
              className={`absolute inset-0 rounded-2xl ${isDown ? "" : "hm-node-breathe"}`}
              style={{
                boxShadow: `0 0 34px -4px ${colorVar}`,
                opacity: 0.5,
              }}
            />
            <Icon size={node.hub ? 24 : 20} strokeWidth={1.8} style={{ color: colorVar }} className="relative" />
            <span className="relative text-[10px] font-semibold text-[var(--ink-100)] text-center leading-tight px-1">
              {node.label}
            </span>
            <span className="relative text-[8.5px] text-[var(--ink-500)] hm-mono">{node.sub}</span>
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{
                background: isDown ? "var(--rose)" : degraded ? "var(--amber)" : "var(--emerald)",
                boxShadow: `0 0 8px ${isDown ? "var(--rose)" : degraded ? "var(--amber)" : "var(--emerald)"}`,
              }}
            />
          </div>
        </div>
      </foreignObject>
    </g>
  );
}