import { useEffect, useRef } from "react";

export function useInterval(callback, delayMs) {
  const savedRef = useRef(callback);

  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return undefined;
    const id = setInterval(() => savedRef.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
