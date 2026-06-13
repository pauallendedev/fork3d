# ForkCode — Live Agent Observatory (Electron) — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorming), pending implementation plan
**Supersedes/amends:** `DESIGN_SPEC.md` §1 (see "Amendment to DESIGN_SPEC.md" below)

## 1. Goal

Turn ForkCode from a pixel-faithful Figma mock with a **fake simulation** into a
real, installable desktop app that visualizes, in real time, the **actual
subagents Claude Code spawns** while working on a project.

ForkCode is an **observer / dashboard**: Claude Code runs as a separate process
(your terminal or IDE); ForkCode only listens to its events and renders them as a
living isometric office. It never edits your code and never reimplements Claude.

The product is a **VS Code-style shell** (the existing React app), wrapped in
**Electron** to be installable, where:

- You **cannot open code** — the editor surface stays replaced by the office.
- You **can** see the real **file tree** (read-only) of the opened project.
- The office shows a **real-time representation of Claude's agents**: empty when
  none run; populated when Claude invokes subagents; they appear and leave live.

## 2. Current state (what exists today)

- React 19 + TS + Vite + zustand. Faithful Figma repro of "SAMS — Spatial Agentic
  Management System": TitleBar, ActivityBar, Explorer, OfficeScene (isometric SVG
  office), CommandPalette, BottomPanel, SystemOverview, SecurityGatePanel,
  StatusBar.
- **Fake data**: `src/state/store.ts` holds **6 fixed agents** (blue/green/…) with
  fixed stations, and a `tick()` simulation (`useSimulation`) that advances fake
  progress and emits fake log lines every second.
- Hardcoded workspace tree in `src/data/workspace.ts`.
- No Electron, no real data sources, not a git repo (now initialized).

## 3. Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Connection model | **Observer** — ForkCode listens; Claude Code runs separately |
| Agent roles | **User-defined custom agents** in `.claude/agents/`; `agent_type` IS the role |
| First version scope | **Núcleo (core) first**; Whiteboard/Kanban/Vault as later phases |
| Telemetry transport | **A + C**: hooks → local HTTP (real-time push) + transcript tailing (enrichment & backfill) |
| Packaging | Electron + electron-builder; macOS `.dmg` first, unsigned for personal use |

## 4. Non-goals / constraints

- **No fork of `microsoft/vscode`/Code-OSS.** "Fork of VS Code" here means *looks
  and feels like VS Code* (already built) + Electron packaging — not forking the
  editor codebase.
- **No code editor / no file contents shown.** Clicking a file shows metadata
  only (path, size, git status), never its content.
- ForkCode's **only disk write** is `.claude/settings.json` (hook install), and
  only with explicit user consent. (Phase 2 also writes `forkcode/board.json`.)
- Keep dependencies minimal: add only `electron` + `electron-builder` (dev). Do
  file watching and the local server with Node built-ins (no chokidar/express).
- All telemetry stays **local to the machine**; nothing is sent to any network.

## 5. Architecture

Single Electron binary, two processes. Claude Code is an external process.

```
  YOUR TERMINAL                         FORKCODE (Electron, installable)
 ┌───────────────┐         ┌──────────────────────────────────────────────┐
 │  Claude Code  │         │  MAIN process (Node)                          │
 │   spawn agent │         │   • Local server 127.0.0.1:4517 (configurable)│
 │   │           │  curl   │   • Transcript tailer (fs.watch ~/.claude)    │
 │   ├ SubagentStart ──POST──▶ • FS service (real tree, read-only)         │
 │   ├ SubagentStop  ──POST──▶ Event normalizer → AgentEvent               │
 │   ├ PostToolUse:TodoWrite─POST▶        │  IPC via preload (contextBridge)│
 │   │           │         │              ▼                                 │
 │   └ writes transcript ─tail─▶ RENDERER (existing React app)             │
 │       .jsonl  │         │      dynamic zustand store → OfficeScene       │
 └───────────────┘         └──────────────────────────────────────────────┘
```

### 5.1 Main process
- Frameless `BrowserWindow` (the app already renders its own TitleBar). Security:
  `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` where
  feasible; renderer reaches main only through a **preload** bridge.
- **Local telemetry server**: Node `http` on `127.0.0.1:4517` (port configurable;
  if busy, try next free port and reflect it in the installed hook command).
  Endpoints: `POST /agent/start`, `/agent/stop`, `/todos`, `/event` (generic).
  Bound to loopback only.
- **Transcript tailer**: `fs.watch` on `~/.claude/projects/<project-hash>/*.jsonl`
  for the open project; parses appended JSONL lines for enrichment (`tool_use`
  activity) and **backfill** of live agents when ForkCode opens mid-session.
  Honors `CLAUDE_CONFIG_DIR` override.
- **FS service**: reads/watches the opened folder tree (read-only).

### 5.2 Renderer
- The existing React app, nearly unchanged. `useSimulation()` is removed from the
  default path; the store instead subscribes to `window.forkcode.onEvent(cb)`.
- The OfficeScene renders from the dynamic store. Components (`Explorer`,
  `BottomPanel`, `SystemOverview`, scene parts) keep their markup; only their data
  source changes.

### 5.3 Preload bridge (`window.forkcode`)
- `onEvent(cb)` — stream of normalized `AgentEvent`s.
- `openFolder()` → path; `readTree(path)` → `FileNode[]`; `onTreeChange(cb)`.
- `connectProject(scope: 'project'|'user')` — install hooks idempotently.
- `getConnectionStatus()` / `onConnectionStatus(cb)`.
- Phase 2: `getBoard()`, `onBoardChange(cb)`. Phase 3: `readEnv()`, `revealEnv(key)`.

## 6. Telemetry & event model

### 6.1 Source hooks (confirmed available in Claude Code)
Installed into `.claude/settings.json`, each runs `curl -X POST -d @- <url>`:

- **`SubagentStart`** → `POST /agent/start`. Payload fields:
  `agent_id`, `agent_type`, `subagent_instructions`, `effort.level`,
  `session_id`, `cwd`, `transcript_path`, `hook_event_name`.
- **`SubagentStop`** → `POST /agent/stop`. Payload: `agent_id`, `agent_type`,
  `session_id`, `cwd`, `transcript_path` (+ optional completion info).
- **`PostToolUse` matcher `TodoWrite`** → `POST /todos`. `tool_input.todos[]` with
  `content`, `status` (`pending|in_progress|completed`), `activeForm`.
- *(Optional)* `PreToolUse` matcher `Agent`/`Task` for `tool_input` enrichment
  (`subagent_type`, `prompt`, `description`) as a fallback for environments where
  `SubagentStart` is unavailable.

**Known caveat:** newer `Task*` tools can bypass `PreToolUse`/`PostToolUse`
(observability gap for programmatic todo updates). The transcript tailer (source C)
is the mitigation: it reconstructs state from the JSONL.

### 6.2 Normalized events (internal)
`agent:start { agentId, role, instructions, color, station, sessionId, cwd, ts }`
· `agent:stop { agentId, status?, ts }`
· `agent:activity { agentId, tool, summary, ts }` (from tailer/PostToolUse)
· `todos:update { items, sessionId, ts }`
· `session:start|end`.

### 6.3 Project filtering
Every event carries `cwd`. ForkCode only renders events whose `cwd` equals the
opened folder (path-normalized, symlink-resolved). Multiple projects → separate
offices, no mixing.

## 7. Data model (store rewrite)

Replace fixed `Record<AgentColor, Agent>` with a dynamic map keyed by `agentId`.

```ts
interface LiveAgent {
  id: string              // agent_id from hook (unique; distinct even in parallel)
  role: string            // agent_type = custom agent name (Ingeniero, …)
  color: AgentColor       // assigned from palette on spawn, stable per id
  status: 'working' | 'success' | 'warning' | 'idle'
  pose: AgentPose
  station: AgentLocation  // derived from role (see §8)
  task: string | null     // subagent_instructions (truncated)
  activity: string | null // latest tool action (from tailer)
  startedAt: number
  endedAt?: number
}
```

- **New actions**: `applyEvent(ev)`, `spawnAgent`, `updateAgent`, `despawnAgent`,
  `setTodos`. Keep UI actions (`selectAgent` now by `id`, `setRadial`, `setZoom`,
  tabs, palette).
- **Lifecycle animation**: on `agent:stop`, do not delete immediately — set
  `status:'success'`, play "walk to gate + fade" (~1.5s), then remove. On spawn,
  "enter through door + walk to station".
- **Empty office**: no agents → furniture only, zero robots.
- **Demo Mode (opt-in toggle)**: keep the existing simulation behind a toggle for
  demos/screenshots without Claude connected. Default **off**.

## 8. Role → office mapping ("make it make sense")

Because the user defines custom agents, `agent_type` is the role. Default map
(configurable in ForkCode settings):

| Role (`agent_type`) | Station | Pose | Rationale |
|---|---|---|---|
| **Ingeniero** (think/design) | Whiteboard | `point` | thinking at the board |
| **Desarrollador** (parallel coding) | Desk | `sit` | coding at the desk |
| **Tester** (probe/break) | Security Gate | `stand`/`walk` | QA at the gate |
| **Analista** (review/context) | Couch/Lounge | `sit` | reading, building context |
| *(other / general-purpose)* | Floor | `stand` | generic |

- **Overflow**: each station is a *zone* that clusters multiple agents; beyond N,
  they arrange in a front-floor grid for that zone. Never overlap.
- **Color identity**: round-robin from the 6-color palette by arrival, stable per
  `id`. Optional: a custom agent may declare its color in frontmatter; honored if
  present.
- **Selection**: clicking a robot shows its `instructions` + live `activity` in the
  existing BottomPanel task sidebar.

## 9. Onboarding & file tree (v1 core)

1. **Open Folder** (like VS Code). ForkCode reads the **real** tree: recursive,
   respects `.gitignore`, ignores `node_modules/.git/dist`. Replaces hardcoded
   `src/data/workspace.ts`; `Explorer` render unchanged, data via IPC.
2. **Read-only, no code.** Folder click = expand/collapse. File click = select +
   metadata (path, size, git `M`/`U`/`✓`), never content.
3. **Connect this project (one click)**: writes hook entries **idempotently** (no
   clobbering existing hooks) into `.claude/settings.json`, pointing `curl` at
   `127.0.0.1:<port>`. Option to install at user scope (`~/.claude/settings.json`).
4. **Connection status**: the existing StatusBar `SAMS: Connected` pill turns green
   only when the server is alive and the project has hooks; grey otherwise.
5. **Backfill**: opening ForkCode mid-session, the tailer reconstructs live agents
   from the latest `*.jsonl` for that `cwd`.
6. FS watching via `fs.watch` (recursive on macOS) refreshes the tree on change.

## 10. Phases 2–3 (designed now, built later)

### Whiteboard (Phase 2) — current development points, clickable
Source: active `TodoWrite` items of the session (literally "what Claude is doing
now"). The scene Whiteboard becomes clickable → overlay listing the real points
(title + status) instead of the decorative flowchart.

### Kanban (Phase 2) — proposals / improvements / bugs + states
Columns **Propuesto · Previsto · Empezado · Acabado** (mapping: pending→Previsto,
in_progress→Empezado, completed→Acabado; "Propuesto" for not-yet-started
bugs/ideas). Hybrid source: live `TodoWrite` **+** a persistent `forkcode/board.json`
that ForkCode maintains (todo snapshots + bug/improvement entries) so the board
survives session close; user/Claude may edit it. The scene KanbanWall becomes
clickable → overlay with the 4 real columns and cards (type, status, responsible
agent).

### Vault (Phase 3) — `.env` values
Reads `.env`, `.env.local`, etc. from the open folder. **Keys always visible,
values masked** (`••••`) with click-to-reveal. Read-only in v1. Fully local, never
logged, never leaves the machine; values stay in main until reveal is requested.
The scene Vault becomes clickable → overlay. Flags sensitive variables (ties into
the existing PROBLEMS "unencrypted variable: DATABASE_URL").

## 11. Packaging

`electron-builder`. Initial target **macOS `.dmg`** (darwin), unsigned for personal
use (add Apple Developer ID notarization later). Config extensible to Windows
(NSIS `.exe`) and Linux (AppImage) without rework. Scripts:
`npm run electron:dev` (Vite dev + Electron) and `npm run dist` (Vite build +
package).

## 12. Security considerations

- Local HTTP server binds to `127.0.0.1` only; no remote exposure.
- Electron hardening: `contextIsolation`, no `nodeIntegration`, preload-only IPC.
- Disk writes limited to `.claude/settings.json` (consented) and
  `forkcode/board.json` (Phase 2). The opened project's code is never written.
- `.env` values are read-only, masked by default, never logged or transmitted.

## 13. Risks & open questions

- **`SubagentStart`/`SubagentStop` availability** varies by Claude Code version and
  is under-documented in the Agent SDK. Mitigation: `PreToolUse:Agent` +
  transcript tailing as fallback to reconstruct lifecycle.
- **Mid-session backfill accuracy** depends on transcript parsing; acceptable to
  show "best-effort" reconstructed agents.
- **Port conflicts**: fall back to next free port; the installed hook command must
  reflect the chosen port (or use a fixed file-based fallback, transport B).
- **Custom-agent naming**: roles must match the names the user gives their
  `.claude/agents/*` files for the 1:1 mapping; unknown types fall to the default
  map row.

## 14. Amendment to DESIGN_SPEC.md

`DESIGN_SPEC.md` §1 states "No new packages." That governed the Figma-repro phase.
This spec **amends** it for the Electron phase: `electron` + `electron-builder`
(dev) are added; all other constraints (inline SVG, tokens, zustand, class
prefixes, plain CSS) remain. `DESIGN_SPEC.md` stays the source of truth for the
**visual shell**; this document is the source of truth for **data, packaging, and
behavior**.

## 15. Implementation phasing summary

- **v1 (core):** Electron shell + real read-only tree + onboarding/hook install +
  live office (real agents, animated spawn/despawn) + real log + optional Demo Mode
  + `.dmg`.
- **Phase 2:** Whiteboard + Kanban (clickable overlays, real data, persistent board).
- **Phase 3:** Vault (`.env`).
