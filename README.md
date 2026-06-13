# ForkCode — SAMS (Spatial Agentic Management System)

A VS Code-style "fork" where the editor surface is replaced by an isometric 3D
office in which six AI agents work in real time. Faithful reproduction of a
Figma design: VS Code shell (activity bar, explorer, terminal panel, command
palette, status bar) around a living agent office.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## What works

- **Office scene**: hand-built isometric SVG office — floor, walls, SAMS wall
  branding, vault, whiteboard, kanban wall, security gate, desk with dual
  monitors, lounge couch, plants — and six chibi robot agents (blue, green,
  orange, purple, red, yellow) with poses, blinking eyes, idle bob and status
  dots. Click any robot to select it.
- **Radial menu**: 8-action pie menu anchored to the selected agent (branch,
  sync, pull, lock…). Every action emits a log line.
- **Command palette**: `⌘K` toggles, `⌘O` runs *Open Agent*, `Esc` closes,
  typing filters commands.
- **Explorer**: SAMS-WORKSPACE tree with agent files (selects the agent),
  workflows, environments, assets and configs, with git-style M/U/✓ badges.
- **System Overview**: live minimap with agent pins (click to select) and a
  zoom control that scales the scene (60–140%).
- **Security Gate panel**: source-control actions (PR, diff, commit, push,
  merge, approve…) that feed the terminal.
- **Bottom panel**: TERMINAL / OUTPUT / EVENT LOG / PROBLEMS tabs, per-agent
  selector, and a live task sidebar (task, branch, status, progress).
- **Simulation**: a zustand store ticks every second — agents advance task
  progress, complete tasks, pick new ones and emit log lines.

## Stack

Vite + React 19 + TypeScript (strict) + zustand. No UI libraries; all icons
and the entire scene are inline SVG. Design tokens in `src/styles/tokens.css`,
isometric projection helpers in `src/scene/iso.tsx`, scene layout anchors in
`src/scene/layout.ts`. The full design spec lives in `DESIGN_SPEC.md`.
