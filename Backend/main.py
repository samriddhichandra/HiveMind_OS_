"""
Multi-Agent System Design Workflow Simulator
=============================================

A FastAPI backend that:
  1. Connects to a local Ollama LLM (llama3 / mistral / etc.) for the
     "Orchestrator" agent's task-breakdown reasoning.
  2. Streams live JSON system-design telemetry over a WebSocket as three
     mock agents (Orchestrator, Worker, Reviewer) work through a task.
  3. Exposes Chaos Monkey HTTP endpoints that inject failures
     (rate limiting, LLM outages) so the running loop demonstrates
     fallback / circuit-breaking behavior in real time.

Run `python main.py` after installing dependencies (see bottom of file
or README.txt included in the zip) and open ws://localhost:8000/ws/simulate
from a frontend, or use the included test client.
"""

import asyncio
import json
import random
import time
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import ollama
except ImportError:  # pragma: no cover
    ollama = None


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Multi-Agent System Design Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_MODEL = "llama3"  # change to "mistral" or any locally pulled model


# ---------------------------------------------------------------------------
# Chaos Monkey global state
# ---------------------------------------------------------------------------
# These flags are toggled by HTTP endpoints and consumed by the running
# WebSocket simulation loop(s) to alter behavior on the fly.

class ChaosState(BaseModel):
    rate_limit_until: float = 0.0   # epoch seconds; simulate 429s until then
    llm_fail_until: float = 0.0     # epoch seconds; force LLM calls to fail
    circuit_open: bool = False      # tripped after repeated failures

    def rate_limited(self) -> bool:
        return time.time() < self.rate_limit_until

    def llm_should_fail(self) -> bool:
        return time.time() < self.llm_fail_until


chaos = ChaosState()


# ---------------------------------------------------------------------------
# Event model & helpers
# ---------------------------------------------------------------------------

class EventStatus(str, Enum):
    HIT = "HIT"
    MISS = "MISS"
    RAG_FETCH = "RAG_FETCH"
    THINKING = "THINKING"
    PLANNING = "PLANNING"
    WORKING = "WORKING"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RATE_LIMITED = "RATE_LIMITED"
    LLM_DOWN = "LLM_DOWN"
    FALLBACK = "FALLBACK"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"
    CIRCUIT_CLOSED = "CIRCUIT_CLOSED"
    RETRY = "RETRY"
    COMPLETE = "COMPLETE"
    ERROR = "ERROR"


def make_event(node: str, status: EventStatus, **extra) -> dict:
    """Build a uniform JSON event payload for the frontend."""
    event = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "node": node,
        "status": status.value if isinstance(status, EventStatus) else status,
    }
    event.update(extra)
    return event


async def send_json(ws: WebSocket, event: dict):
    await ws.send_text(json.dumps(event))


# ---------------------------------------------------------------------------
# Ollama integration
# ---------------------------------------------------------------------------

def _ollama_chat_sync(prompt: str, model: str = OLLAMA_MODEL) -> str:
    """
    Blocking call to the local Ollama server. Run inside a thread via
    asyncio.to_thread so it doesn't block the event loop / WebSocket.
    """
    if ollama is None:
        raise RuntimeError(
            "The 'ollama' python package is not installed. "
            "Run: pip install ollama"
        )
    response = ollama.chat(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the Orchestrator agent in a multi-agent system "
                    "design workflow. Break the user's task into 3-5 short, "
                    "concrete subtasks. Reply with a compact numbered list, "
                    "no extra commentary."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        options={"temperature": 0.4},
    )
    return response["message"]["content"]


async def call_orchestrator_llm(prompt: str) -> str:
    """
    Async wrapper around the Ollama call that respects Chaos Monkey state
    (simulated LLM outage) and falls back to a canned breakdown if the
    real Ollama call fails for any reason (model not pulled, server not
    running, chaos-induced failure, etc.).
    """
    if chaos.llm_should_fail():
        raise RuntimeError("Chaos Monkey: LLM outage injected")

    try:
        text = await asyncio.to_thread(_ollama_chat_sync, prompt)
        return text
    except Exception as exc:
        # Bubble up so the caller can decide on fallback / circuit logic
        raise RuntimeError(f"Ollama call failed: {exc}") from exc


FALLBACK_BREAKDOWN = (
    "1. Parse user requirements\n"
    "2. Retrieve relevant context from vector store\n"
    "3. Draft candidate system design\n"
    "4. Validate against constraints\n"
    "5. Return final design summary"
)


# ---------------------------------------------------------------------------
# Simulated infra nodes (Redis cache, Vector DB) - lightweight mocks
# ---------------------------------------------------------------------------

_fake_cache: dict[str, str] = {}


async def simulate_redis_lookup(ws: WebSocket, key: str):
    await asyncio.sleep(random.uniform(0.05, 0.15))
    hit = key in _fake_cache
    latency_ms = round(random.uniform(0.5, 4.0), 2)
    if hit:
        await send_json(
            ws,
            make_event("Redis Cache", EventStatus.HIT, key=key, latency=f"{latency_ms}ms"),
        )
    else:
        await send_json(
            ws,
            make_event("Redis Cache", EventStatus.MISS, key=key, latency=f"{latency_ms}ms"),
        )
        _fake_cache[key] = "cached_value"
    return hit


async def simulate_vector_db_fetch(ws: WebSocket, query: str):
    await asyncio.sleep(random.uniform(0.1, 0.3))
    tokens = random.randint(256, 1024)
    await send_json(
        ws,
        make_event("Vector DB", EventStatus.RAG_FETCH, query=query[:60], tokens=tokens),
    )
    return tokens


# ---------------------------------------------------------------------------
# Circuit breaker helper
# ---------------------------------------------------------------------------

class CircuitBreaker:
    """Simple failure-count based circuit breaker for LLM calls."""

    def __init__(self, failure_threshold: int = 2, cooldown_seconds: int = 15):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.opened_at: Optional[float] = None

    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        if time.time() - self.opened_at > self.cooldown_seconds:
            # Half-open: allow a trial request
            return False
        return True

    def record_success(self):
        self.failure_count = 0
        if self.opened_at is not None:
            self.opened_at = None

    def record_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.opened_at = time.time()


breaker = CircuitBreaker()


# ---------------------------------------------------------------------------
# Agent workflow
# ---------------------------------------------------------------------------

async def orchestrator_phase(ws: WebSocket, user_task: str) -> list[str]:
    await send_json(
        ws,
        make_event("Orchestrator", EventStatus.PLANNING, task=user_task),
    )

    # Circuit breaker check first
    if breaker.is_open():
        await send_json(
            ws,
            make_event(
                "Orchestrator",
                EventStatus.CIRCUIT_OPEN,
                message="Circuit open - skipping live LLM call, using fallback plan",
                cooldown_remaining_s=round(
                    breaker.cooldown_seconds - (time.time() - breaker.opened_at), 1
                ) if breaker.opened_at else 0,
            ),
        )
        breakdown_text = FALLBACK_BREAKDOWN
    else:
        try:
            breakdown_text = await call_orchestrator_llm(user_task)
            breaker.record_success()
            await send_json(
                ws,
                make_event(
                    "Orchestrator",
                    EventStatus.THINKING,
                    prompt_tokens=len(user_task.split()) * 2,
                    model=OLLAMA_MODEL,
                    breakdown=breakdown_text.strip(),
                ),
            )
        except Exception as exc:
            breaker.record_failure()
            await send_json(
                ws,
                make_event(
                    "Orchestrator",
                    EventStatus.LLM_DOWN,
                    error=str(exc),
                ),
            )
            await send_json(
                ws,
                make_event(
                    "Orchestrator",
                    EventStatus.FALLBACK,
                    message="Falling back to static task breakdown",
                ),
            )
            breakdown_text = FALLBACK_BREAKDOWN

    subtasks = [
        line.strip(" .")
        for line in breakdown_text.splitlines()
        if line.strip() and any(ch.isalnum() for ch in line)
    ]
    # Keep it manageable
    subtasks = subtasks[:5] if subtasks else ["Analyze task", "Produce design"]
    return subtasks


async def worker_phase(ws: WebSocket, subtasks: list[str]):
    for i, subtask in enumerate(subtasks, start=1):
        agent_name = f"Agent_{i}"

        # Chaos: simulate rate limiting on worker calls
        if chaos.rate_limited():
            await send_json(
                ws,
                make_event(
                    agent_name,
                    EventStatus.RATE_LIMITED,
                    message="429 Too Many Requests (Chaos Monkey)",
                    retry_after="3s",
                ),
            )
            await asyncio.sleep(1.0)
            await send_json(
                ws,
                make_event(agent_name, EventStatus.RETRY, subtask=subtask),
            )

        await send_json(
            ws,
            make_event(
                agent_name,
                EventStatus.THINKING,
                subtask=subtask,
                prompt_tokens=random.randint(80, 200),
            ),
        )

        await simulate_redis_lookup(ws, key=subtask)
        await simulate_vector_db_fetch(ws, query=subtask)

        await asyncio.sleep(random.uniform(0.2, 0.5))

        await send_json(
            ws,
            make_event(
                agent_name,
                EventStatus.WORKING,
                subtask=subtask,
                output_tokens=random.randint(100, 400),
                latency=f"{round(random.uniform(50, 300), 1)}ms",
            ),
        )


async def reviewer_phase(ws: WebSocket, subtasks: list[str]):
    await send_json(ws, make_event("Reviewer", EventStatus.REVIEWING, count=len(subtasks)))
    await asyncio.sleep(random.uniform(0.3, 0.6))

    approved = random.random() > 0.15  # ~85% approval rate
    if approved:
        await send_json(
            ws,
            make_event(
                "Reviewer",
                EventStatus.APPROVED,
                message="Design meets constraints",
                score=round(random.uniform(0.8, 0.99), 2),
            ),
        )
    else:
        await send_json(
            ws,
            make_event(
                "Reviewer",
                EventStatus.REJECTED,
                message="Design needs revision - latency budget exceeded",
                score=round(random.uniform(0.4, 0.65), 2),
            ),
        )
    return approved


async def run_workflow(ws: WebSocket, user_task: str):
    """One full pass of the Orchestrator -> Worker -> Reviewer loop."""
    subtasks = await orchestrator_phase(ws, user_task)
    await worker_phase(ws, subtasks)
    approved = await reviewer_phase(ws, subtasks)

    await send_json(
        ws,
        make_event(
            "Orchestrator",
            EventStatus.COMPLETE,
            approved=approved,
            subtasks_completed=len(subtasks),
        ),
    )
    return approved


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/simulate")
async def ws_simulate(websocket: WebSocket):
    """
    Client connects, then sends a JSON message like:
        {"task": "Design a scalable chat notification system", "loops": 3}

    Server streams a sequence of JSON events (see make_event) as agents
    work through the task. If `loops` > 1, the workflow repeats, giving
    Chaos Monkey endpoints time to be triggered mid-run from another
    terminal/HTTP client to observe fallback/circuit-breaking live.
    """
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"task": raw}

        user_task = payload.get("task", "Design a scalable URL shortener")
        loops = int(payload.get("loops", 1))

        await send_json(
            websocket,
            make_event(
                "System",
                "SESSION_START",
                task=user_task,
                loops=loops,
                model=OLLAMA_MODEL,
            ),
        )

        for loop_idx in range(1, loops + 1):
            await send_json(
                websocket,
                make_event("System", "LOOP_START", loop=loop_idx, of=loops),
            )
            await run_workflow(websocket, user_task)
            await asyncio.sleep(0.5)

        await send_json(websocket, make_event("System", "SESSION_END"))

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as exc:
        try:
            await send_json(websocket, make_event("System", EventStatus.ERROR, error=str(exc)))
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Chaos Monkey HTTP endpoints
# ---------------------------------------------------------------------------

class ChaosDuration(BaseModel):
    seconds: int = 10


@app.post("/trigger-rate-limit")
async def trigger_rate_limit(body: ChaosDuration = ChaosDuration()):
    """
    Forces subsequent Worker agent calls to receive simulated 429s for
    `seconds`. The running WebSocket loop will emit RATE_LIMITED events
    and retry automatically.
    """
    chaos.rate_limit_until = time.time() + body.seconds
    return {
        "status": "ok",
        "message": f"Rate limiting active for {body.seconds}s",
        "active_until": chaos.rate_limit_until,
    }


@app.post("/fail-llm")
async def fail_llm(body: ChaosDuration = ChaosDuration()):
    """
    Forces the Orchestrator's Ollama calls to fail for `seconds`,
    triggering the fallback static breakdown and, on repeated failures,
    tripping the circuit breaker.
    """
    chaos.llm_fail_until = time.time() + body.seconds
    return {
        "status": "ok",
        "message": f"LLM outage simulated for {body.seconds}s",
        "active_until": chaos.llm_fail_until,
    }


@app.post("/reset-chaos")
async def reset_chaos():
    """Clear all chaos flags and reset the circuit breaker."""
    chaos.rate_limit_until = 0.0
    chaos.llm_fail_until = 0.0
    breaker.failure_count = 0
    breaker.opened_at = None
    return {"status": "ok", "message": "Chaos state reset"}


@app.get("/chaos-status")
async def chaos_status():
    return {
        "rate_limited": chaos.rate_limited(),
        "rate_limit_until": chaos.rate_limit_until,
        "llm_failing": chaos.llm_should_fail(),
        "llm_fail_until": chaos.llm_fail_until,
        "circuit_open": breaker.is_open(),
        "circuit_failure_count": breaker.failure_count,
    }


@app.get("/")
async def root():
    return {
        "service": "Multi-Agent System Design Simulator",
        "websocket_endpoint": "/ws/simulate",
        "chaos_endpoints": [
            "POST /trigger-rate-limit {seconds: int}",
            "POST /fail-llm {seconds: int}",
            "POST /reset-chaos",
            "GET  /chaos-status",
        ],
        "ollama_model": OLLAMA_MODEL,
    }


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
