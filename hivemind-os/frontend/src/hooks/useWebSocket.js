import { useEffect, useRef, useState } from "react";

const WS_URL = "/ws/simulate";

export function useWebSocket(task, loops = 1) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!task) return;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        // Send task to start simulation
        ws.send(JSON.stringify({ task, loops }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        setError("WebSocket connection error");
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [task, loops]);

  return { events, connected, error };
}