# ForkCode v1.1 — Functional Shell — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorming), pending implementation plan
**Builds on:** `docs/superpowers/specs/2026-06-13-forkcode-electron-live-agents-design.md` (v1, shipped)

## 1. Goal

Make the VS Code-style shell around the agent office **actually functional**, not a
faithful-but-decorative Figma reproduction. The user asked for: the folder button to
live on the Explorer (VS Code style), a **real usable terminal**, working ActivityBar
panels, and read-only file viewing — "todo".

## 2. Current state (what's wired vs decorative after v1)

**Wired:** Open Folder, Connect project, Demo toggle, the live agent office, Explorer
tree expand/collapse, agent selection, BottomPanel tab switching, zoom, command-palette
text filtering, the warnings pill → Problems.

**Decorative (Figma chrome):** ActivityBar items don't switch panels; the 4 titlebar
ghost icons; most StatusBar pills; BottomPanel +/split/trash; most command-palette
commands; the "TERMINAL" tab only shows the agent log (not a real shell).

## 3. Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Scope | All four: terminal, folder→Explorer, ActivityBar panels, read-only file view ("todo") |
| Terminal | **Real interactive terminal** — `xterm` + `node-pty` (native, needs `@electron/rebuild`) |
| File viewer | **Shiki** (VS Code's own grammars/themes → identical look), lazy-loaded, read-only |

## 4. Amendment to prior constraints

- v1's design §4 said **"no code editor / no file contents shown."** This is **relaxed**
  to **read-only file viewing** (highlighted, not editable) per the user's explicit
  choice. The office remains the centerpiece; files open as additional tabs.
- v1's "minimal deps" posture is further relaxed: this phase adds `@xterm/xterm`,
  `@xterm/addon-fit`, `node-pty`, `shiki`, and `@electron/rebuild` (dev). All telemetry,
  fs, search, git, and pty logic stays in the Electron main process behind the preload
  bridge; the renderer stays sandboxed (`contextIsolation: true`).

## 5. Architecture

### 5.1 Store additions (`src/state/store.ts` + types)
```ts
type ActiveView = 'explorer' | 'search' | 'scm' | 'spatial' | 'extensions'

interface EditorTab {
  id: string                 // 'office' for the pinned office tab; otherwise the file path
  kind: 'office' | 'file'
  title: string              // 'Office' or the file basename
  path?: string              // for file tabs
}
```
New state: `activeView` (default `'explorer'`); `openTabs: EditorTab[]` (always contains
the pinned `office` tab first); `activeTabId` (default `'office'`); `sidebarVisible`,
`panelVisible` (default `true`). New actions: `setActiveView`, `openFileTab(path, title)`,
`closeTab(id)`, `setActiveTab(id)`, `toggleSidebar`, `togglePanel`. The terminal session
lives in xterm↔main, NOT in the store.

### 5.2 New main-process IPC (behind `window.forkcode`)
- `readFile(path): Promise<FilePayload>` where `FilePayload = { content: string; lang: string; truncated: boolean; binary: boolean }`. Guards: refuse files > 1 MB (`truncated`), detect binary (NUL byte in first 8 KB → `binary: true`, no content). `lang` is derived from the extension for Shiki. **Path must resolve inside the open project root** (reject traversal).
- `search(query: string): Promise<SearchHit[]>` where `SearchHit = { path: string; line: number; col: number; preview: string }`. Runs over the open root: prefer `rg` (ripgrep) via `child_process` if present, else a Node fs walker with substring match (respecting the same ignore set as the tree). Cap at ~200 hits; report if capped.
- `gitStatus(): Promise<{ branch: string; files: { path: string; x: string; y: string }[] }>` — `git -C <root> status --porcelain=v1 -b`, parsed. Empty/non-git → `{ branch: '', files: [] }` (never throws).
- Terminal (single session in v1.1): `ptySpawn({ cols, rows }): Promise<void>`, `ptyWrite(data)`, `ptyResize(cols, rows)`, `ptyKill()`, plus push events `onPtyData(cb)` and `onPtyExit(cb)`. The pty spawns the user's `$SHELL` (fallback `/bin/zsh`) with `cwd` = the open project root (or home if none).

### 5.3 New / changed components
- `src/components/Sidebar.tsx` — reads `activeView`, renders the matching panel; the
  sidebar card in `App.tsx` now mounts `<Sidebar/>` instead of `<Explorer/>` directly.
- `src/components/Explorer.tsx` — gains a VS Code **empty state**: when no folder is open,
  show a centered "Open Folder" button (calls `openFolder`). The **titlebar folder button
  is removed**; opening a folder now lives here + a command-palette action.
- `src/components/SearchPanel.tsx` — search input (debounced) → `search()` → grouped
  results; clicking a hit calls `openFileTab(path)` and (later) scrolls to the line.
- `src/components/SourceControlPanel.tsx` — branch header + changed-files list from
  `gitStatus()` (read-only; no staging/commit in v1.1); clicking a file opens it.
- `src/components/ExtensionsPanel.tsx` — honest placeholder ("Managed by ForkCode — agent
  roles are configured in `.claude/agents/`"). No marketplace.
- `src/components/EditorArea.tsx` — replaces the direct OfficeScene mount in the center
  column. Renders `EditorTabs` (tab bar) + the active tab's body: `office` → `<OfficeScene/>`
  + `<CommandPalette/>`; `file` → `<FileView/>`.
- `src/components/EditorTabs.tsx` — the tab strip; office tab is pinned (no close button),
  file tabs closable; click selects.
- `src/components/FileView.tsx` — `readFile(path)` then highlight with **Shiki** (dynamic
  `import('shiki')`, one highlighter instance memoized, theme matching the app). Read-only,
  line numbers. Renders a clear message for `binary`/`truncated`.
- `src/scene/parts/Terminal.tsx` (or `src/components/Terminal.tsx`) — an `xterm` terminal
  mounted in the BottomPanel TERMINAL tab; `FitAddon` for sizing; spawns the pty on mount,
  pipes `onPtyData → term.write`, `term.onData → ptyWrite`, resize → `ptyResize`.
- `src/components/BottomPanel.tsx` — TERMINAL tab hosts `<Terminal/>`; the agent log moves
  to EVENT LOG (already present); OUTPUT/PROBLEMS unchanged.
- `src/components/ActivityBar.tsx` — each item calls `setActiveView`; the active item is
  driven by `activeView` (not a hardcoded "Explorer active").
- `src/components/StatusBar.tsx` — branch pill shows the real `gitStatus().branch`.
- `src/components/TitleBar.tsx` — remove the folder button; the panel-layout ghost icons
  call `toggleSidebar`/`togglePanel`; keep Connect + Demo buttons.
- `src/components/CommandPalette.tsx` + `src/data/commands.ts` — commands run real actions
  (Open Folder, Connect Project, Toggle Demo, Toggle Terminal, Go to Explorer/Search/SCM,
  New/Clear Terminal, Close Tab).

### 5.4 Data flow
- **Sidebar:** ActivityBar click → `setActiveView` → `Sidebar` swaps panel.
- **Open file:** Explorer/Search/SCM click → `openFileTab(path)` → `EditorArea` shows
  `FileView` → `readFile` + Shiki render.
- **Terminal:** `Terminal` mounts → `ptySpawn` → `onPtyData`→`term.write`; `term.onData`→
  `ptyWrite`; ResizeObserver→`fit()`→`ptyResize`.
- The **office** stays driven by the existing telemetry pipeline (unchanged).

## 6. Office polish (gate-walk + idle movement)

Agents currently "pop" in at their station. New behavior:
- **Entrance:** a spawned agent first appears at the **security gate** anchor, then
  **walks** (pose `walk`, with the existing sway) along a path to its station zone over
  ~1.0–1.4 s, then settles into its station pose. Implemented by animating the outer
  positioning `<g>` (or an intermediate group) from the gate point to the station point
  (JS rAF interpolation or SMIL/`<animateTransform>`), keeping the position on the SVG
  attribute path so it never fights CSS transforms (the v1 bug).
- **Idle-in-zone:** while `working`, a subtle slow drift within the zone (a few px,
  several-second period) so the office feels alive, not frozen.
- **Exit:** keep the existing fade on `agent:stop` (optionally walk back to the gate first).

## 7. Phases (each independently shippable & verifiable)

- **P1 — Sidebar framework + Explorer open-folder.** `activeView` + `Sidebar` + ActivityBar
  switching; Explorer empty-state "Open Folder"; remove titlebar folder button; placeholder
  Search/SCM/Extensions panels. *No new deps.* **Done when:** clicking ActivityBar icons
  swaps the sidebar; Explorer shows "Open Folder" when empty and the real tree when opened.
- **P2 — Editor tabs + file viewer.** `EditorArea`/`EditorTabs`; Office as the pinned first
  tab; `readFile` IPC; `FileView` with Shiki; clicking a tree file opens a read-only tab.
  *Dep: shiki.* **Done when:** clicking a file opens a highlighted read-only tab; the Office
  tab still shows the live office; binary/large files show a message.
- **P3 — Real terminal.** `node-pty` in main + pty IPC; `xterm` `Terminal` in the TERMINAL
  tab; `@electron/rebuild` wired into the build; `node-pty` included in the packaged app.
  *Deps: xterm, addon-fit, node-pty, @electron/rebuild.* **Done when:** the TERMINAL tab is a
  real interactive shell in the project cwd (runs `ls`, `npm`, `git`, vim, colors) in dev
  AND in the packaged `.dmg`.
- **P4 — Search + Source Control panels.** `search()` and `gitStatus()` IPC; `SearchPanel`
  and `SourceControlPanel` wired; results/files open file tabs; StatusBar branch real.
  **Done when:** searching shows real hits that open files; SCM lists real changed files.
- **P5 — Office gate-walk + idle movement + palette/buttons polish.** §6 animation; command
  palette real actions; panel-toggle ghost icons toggle sidebar/panel. **Done when:** agents
  walk in from the gate and drift in-zone; palette commands and toggle icons work.

## 8. Risks & open questions

- **`node-pty` native build (P3, main risk):** must be rebuilt for Electron's ABI
  (`@electron/rebuild`) and bundled into the app (electron-builder `asarUnpack` for the
  `.node` binary; node-pty cannot run from inside asar). The plan will pin the exact setup
  (and consider a prebuilt pty fork if rebuild is fragile). Verified only when the packaged
  `.dmg` terminal works, not just dev.
- **Shiki bundle size (P2):** lazy-load the highlighter and only the grammars actually used
  (load language on demand) to avoid bloating the renderer bundle.
- **Search performance (P4):** prefer ripgrep; the Node fallback must cap results and skip
  the ignore set to stay responsive on large repos.
- **Terminal = arbitrary command execution:** by design (it's the user's own shell on their
  machine), but note it; the pty is scoped to the project cwd and runs the user's `$SHELL`.

## 9. Security

- `readFile`/`search`/`gitStatus` are read-only and **scoped to the open project root**
  (reject paths resolving outside it). Binary/oversize guarded.
- pty data crosses IPC only; `contextIsolation`/`sandbox` unchanged; no Node in the renderer.
- No new disk writes beyond v1's (`.claude/settings.json` on Connect).

## 10. Out of scope (v1.1)

Editing/saving files; multiple terminals; SCM staging/commit/push; a real Extensions
marketplace; debugging; settings UI. (Candidates for later.)
