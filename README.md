# 7-an (Tujuhan Tactical)

A Progressive Web App (PWA) implementation of the traditional Indonesian card game **"7-an" (Tujuh Sekop / Sevens)**. Designed with a Neo-Brutalism aesthetic and built for zero-cost infrastructure using a Single Source of Truth (SSOT) architecture across client and server.

---

## Architecture Overview

This project is structured as a Go and TypeScript monorepo:

- **`pkg/engine`**: Pure Go core game engine with zero external I/O dependencies. Implements deck distribution (auto-reshuffle on $\ge$ 3 sevens), table card placement, move validation (no-bluff enforcement, anti-sabotage for 7s), Ace mode state machine (Low = 1 pt, High = 15 pts, Locked None = 0 pts), end-game penalty calculation, and AI bot heuristics.
- **`cmd/wasm`**: Go WebAssembly entrypoint compiling `pkg/engine` to `game.wasm`, exposing `window.SevensWasm` for offline browser play and instant client-side validation.
- **`cmd/server`**: Authoritative WebSocket backend server built with Go and Melody.
- **`internal/room`**: In-memory room lifecycle, turn timing, automatic bot backfilling, 30-second disconnect tolerance, and host migration.
- **`frontend`**: React 18 + Vite + Tailwind CSS + Zustand PWA with offline Service Worker support.

---

## Prerequisites

- **Go**: 1.22+
- **Node.js**: 18+ and **npm**
- **TinyGo** *(optional, recommended)*: Produces sub-megabyte `.wasm` binaries. If not installed, standard Go is used automatically (~4.7MB).
- **Make**: Standard build runner (optional; equivalent shell commands listed below).

---

## Quick Start

### 1. Install Dependencies

```bash
make init
# Or manually:
go mod tidy
cd frontend && npm install
```

### 2. Build WebAssembly Engine

Compiles the shared Go engine to `frontend/public/game.wasm` and copies `wasm_exec.js`:

```bash
make build-wasm
```

### 3. Run Locally

**Backend Server** (default port `8080`):

```bash
make run-server
# Or manually:
go run ./cmd/server/main.go
```

**Frontend Dev Server**:

```bash
make run-client
# Or manually:
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Testing & Build

Run engine and room manager tests:

```bash
go test -v ./...
```

Build frontend for production:

```bash
make build-client
# Or manually:
make build-wasm
cd frontend && npm run build
```

---

## Deployment

- **Frontend**: Cloudflare Pages (Deploy directory: `frontend/dist`).
- **Backend**: Render Free Tier or any container runtime using the root `Dockerfile` (`PORT=8080`, `GOMEMLIMIT=420MiB`, `GOGC=80`).
