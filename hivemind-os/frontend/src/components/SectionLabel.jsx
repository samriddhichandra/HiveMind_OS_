export default function SectionLabel({ icon: Icon, children, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2 text-[var(--ink-300)]">
        {Icon ? <Icon size={14} strokeWidth={2.25} /> : null}
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{children}</span>
      </div>
      {right}
    </div>
  );
}
