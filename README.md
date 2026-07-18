# HiveMind OS

> Multi-Agent System Design Workflow Simulator with Chaos Engineering

A real-time distributed swarm control plane that demonstrates multi-agent system design patterns with live telemetry, circuit breaking, and chaos injection capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

HiveMind OS simulates a distributed multi-agent system where:

- **Orchestrator** agent breaks down complex tasks using LLM reasoning
- **Worker agents** process subtasks with cache and vector database lookups
- **Reviewer** agent validates and approves the final design
- **Chaos Monkey** injects failures to demonstrate resilience patterns

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HiveMind OS Architecture                          │
└─────────────────────────────────────────────────────────────────────────────┘

                               ┌──────────────┐
                               │  API Client  │
                               │  (Browser)   │
                               └──────┬───────┘
                                      │
                                      ▼
                     ┌────────────────────────────────┐
                     │         Frontend (React)           │
                     │  ┌──────────────────────────────┐  │
                     │  │  Live Event Stream Display   │  │
                     │  ├──────────────────────────────┤  │
                     │  │  Architecture Graph (SVG)    │  │
                     │  ├──────────────────────────────┤  │
                     │  │  Metrics Dashboard           │  │
                     │  ├──────────────────────────────┤  │
                     │  │  Chaos Controls              │  │
                     │  └──────────────────────────────┘  │
                     └───────────────┬────────────────────┘
                                     │ WebSocket
                                     ▼
                     ┌────────────────────────────────┐
                     │         Backend (FastAPI)          │
                     │  ┌──────────────────────────────┐  │
                     │  │  WebSocket /ws/simulate      │  │
                     │  ├──────────────────────────────┤  │
                     │  │  Chaos Endpoints             │  │
                     │  │  • /trigger-rate-limit       │  │
                     │  │  • /fail-llm                 │  │
                     │  │  • /reset-chaos              │  │
                     │  │  • /chaos-status             │  │
                     │  └───────────┬──────────────────┘  │
                     └──────────────┼─────────────────────┘
                                    │
                     ┌──────────────┼─────────────────────┐
                     │              │                     │
                     ▼              ▼                     ▼
             ┌────────────┐  ┌────────────┐      ┌──────────────┐
             │  Ollama    │  │  Redis     │      │  Vector DB   │
             │  (LLM)     │  │  (Cache)   │      │  (Mock)      │
             └────────────┘  └────────────┘      └──────────────┘
```

### Agent Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Multi-Agent Workflow                              │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │   User      │
     │  (Task)     │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
     │ Orchestrator│────▶│  Workers    │────▶│  Reviewer  │
     │   (LLM)     │     │ (Agents)    │     │             │
     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
            │                   │                   │
            │                   ▼                   │
            │            ┌─────────────┐            │
            │            │   Cache     │            │
            │            │  (Redis)    │            │
            │            └──────┬──────┘            │
            │                   │                   │
            │                   ▼                   │
            │            ┌─────────────┐            │
            │            │ Vector DB   │            │
            │            │  (RAG)      │            │
            │            └───────────────┘          │
            │                                       │
            └─────────────────────────────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │   Complete     │
                           │  (Approved/    │
                           │   Rejected)    │
                           └────────────────┘
```

### Chaos Engineering Impact

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Chaos Impact Matrix                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┬─────────────────────────────────────────────────────────────┐
│ Chaos Type     │ Impacted Components                                         │
├────────────────┼─────────────────────────────────────────────────────────────┤
│ Rate Limit     │ • API Gateway (429 errors)                                  │
│                │ • WebSocket connections (reduced)                           │
│                │ • Pod replicas (auto-scaling)                               │
├────────────────┼─────────────────────────────────────────────────────────────┤
│ Network Latency│ • Redis Cache (slower responses)                            │
│                │ • Kafka (consumer lag)                                      │
│                │ • Cache hit rate (degraded)                                 │
├────────────────┼─────────────────────────────────────────────────────────────┤
│ LLM Outage     │ • Orchestrator (circuit breaker opens)                      │
│                │ • Coder/Reviewer agents (fallback mode)                     │
│                │ • All metrics (degraded performance)                        │
└────────────────┴─────────────────────────────────────────────────────────────┘
```

## Features

- ✅ **Real-time WebSocket streaming** - Live event feed from multi-agent workflow
- ✅ **LLM Integration** - Ollama-powered task breakdown with fallback
- ✅ **Circuit Breaker** - Automatic failover on repeated failures
- ✅ **Chaos Monkey** - Inject failures to test resilience
- ✅ **Live Metrics** - Tokens/sec, cache hit rate, connections, pod count
- ✅ **Interactive Graph** - SVG architecture visualization with pulse animations
- ✅ **Event Stream** - Terminal-style log display with color-coded levels

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend build & runtime |
| Ollama | Latest | Local LLM inference (optional) |

## Installation

### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd hivemind-os/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Ollama Setup (Optional)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3
# or for a lighter model:
ollama pull mistral

# Verify it's running
curl http://localhost:11434/api/tags
```

## Usage

1. Start the backend server (`python main.py`)
2. Start the frontend dev server (`npm run dev`)
3. Open `http://localhost:5173` in your browser
4. Enter a task (e.g., "Design a scalable chat notification system")
5. Click "Start" to begin the simulation
6. Use Chaos Monkey controls to inject failures during runtime

## API Reference

### WebSocket Endpoint

**Connect:** `ws://localhost:8000/ws/simulate`

**Request:**
```json
{
  "task": "Design a scalable URL shortener",
  "loops": 3
}
```

**Response Events:**

| Event | Description |
|-------|-------------|
| `SESSION_START` | Simulation begins |
| `LOOP_START` | New workflow iteration |
| `PLANNING` | Orchestrator breaking down task |
| `THINKING` | LLM processing |
| `HIT/MISS` | Cache lookup result |
| `RAG_FETCH` | Vector DB query |
| `WORKING` | Worker processing subtask |
| `REVIEWING` | Reviewer validation |
| `APPROVED/REJECTED` | Review result |
| `COMPLETE` | Workflow finished |
| `SESSION_END` | Simulation complete |

### HTTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trigger-rate-limit` | Simulate 429 rate limiting |
| POST | `/fail-llm` | Simulate LLM outage |
| POST | `/reset-chaos` | Reset all chaos state |
| GET | `/chaos-status` | Get current chaos state |

#### Trigger Rate Limit

```bash
curl -X POST http://localhost:8000/trigger-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10}'
```

Effect: for the next 10 seconds, each `Agent_N` worker emits a `RATE_LIMITED` event, sleeps briefly, then emits a `RETRY` event before continuing — simulating exponential backoff / retry logic.

#### Simulate LLM Outage

```bash
curl -X POST http://localhost:8000/fail-llm \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10}'
```

Effect: the Orchestrator's Ollama call fails immediately, it emits an `LLM_DOWN` event followed by a `FALLBACK` event, and uses a static canned task breakdown instead of live LLM output. If failures repeat past the failure threshold, a circuit breaker trips and subsequent Orchestrator phases emit `CIRCUIT_OPEN` and skip calling the LLM entirely until the cooldown elapses.

#### Reset Chaos State

```bash
curl -X POST http://localhost:8000/reset-chaos
```

Clears all chaos flags and resets the circuit breaker.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_MODEL` | `llama3` | LLM model to use |
| `PORT` | `8000` | Backend server port |

### Chaos Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Rate limit duration | 10s | Configurable via request body |
| LLM outage duration | 10s | Configurable via request body |
| Circuit breaker threshold | 2 failures | Trips after repeated failures |
| Circuit breaker cooldown | 15s | Time before allowing retry |

## Development

### Project Structure

```
multiagent_sim/
├── Backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── test_client.py    # WebSocket test client
├── hivemind-os/
│   └── frontend/
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       └── src/
│           ├── App.jsx
│           ├── main.jsx
│           ├── index.css
│           ├── components/
│           │   ├── Header.jsx
│           │   ├── ChaosToggle.jsx
│           │   └── RightSidebar.jsx
│           ├── data/
│           │   └── logs.js
│           ├── hooks/
│           │   └── useWebSocket.js
│           └── utils/
└── README.md
```

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Backend:**
```bash
python main.py   # Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # Alternative start
```

### Quick Test

```bash
# Terminal 1: Start backend
cd Backend && python main.py

# Terminal 2: Run test client
cd Backend && python test_client.py "Design a scalable chat notification system" 3
```

## Troubleshooting

### Common Issues

**WebSocket connection failed:**
- Ensure backend is running on port 8000
- Check CORS configuration in vite.config.js
- Verify no firewall is blocking the connection

**LLM calls failing:**
- Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
- Pull a model: `ollama pull llama3`
- The system will use fallback breakdown if Ollama is unavailable

**Frontend not loading:**
- Check Node.js version (requires 18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Rate limiting not working:**
- Ensure the simulation has `loops > 1` to observe chaos effects
- Check the chaos status endpoint: `curl http://localhost:8000/chaos-status`

## License

MIT License - See [LICENSE](LICENSE) file for details.