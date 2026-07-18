"""
Minimal WebSocket test client.

Usage:
    python test_client.py "Design a scalable chat notification system" 3

While this is running, open another terminal and try the Chaos Monkey
endpoints to see fallback/circuit-breaking behavior live:

    curl -X POST http://localhost:8000/trigger-rate-limit -H "Content-Type: application/json" -d "{\"seconds\": 10}"
    curl -X POST http://localhost:8000/fail-llm -H "Content-Type: application/json" -d "{\"seconds\": 10}"
    curl -X POST http://localhost:8000/reset-chaos
"""

import asyncio
import json
import sys

import websockets

URI = "ws://localhost:8000/ws/simulate"


async def main():
    task = sys.argv[1] if len(sys.argv) > 1 else "Design a scalable URL shortener"
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 2

    async with websockets.connect(URI) as ws:
        await ws.send(json.dumps({"task": task, "loops": loops}))
        async for message in ws:
            event = json.loads(message)
            print(json.dumps(event, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
