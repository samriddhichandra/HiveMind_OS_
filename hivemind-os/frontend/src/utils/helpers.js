export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function randWalk(value, min, max, step) {
  const next = value + (Math.random() - 0.5) * step;
  return clamp(next, min, max);
}
