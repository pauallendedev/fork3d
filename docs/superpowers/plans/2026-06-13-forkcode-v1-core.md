# ForkCode v1 (Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ForkCode from a faked-simulation Figma mock into an installable Electron app that shows the real read-only file tree of an opened project and a live isometric office of the real subagents Claude Code spawns.

**Architecture:** Observer model. Claude Code runs separately and fires `SubagentStart`/`SubagentStop`/`PostToolUse:TodoWrite` hooks that `curl` JSON to a loopback HTTP server inside ForkCode's Electron main process. Main normalizes events, filters by `cwd`, and pushes them over a secure `contextBridge` preload to the existing React renderer, which drives a dynamic zustand store. A transcript tailer enriches activity and backfills running agents. Built/packaged with `vite-plugin-electron` + `electron-builder`.

**Tech Stack:** React 19 + TypeScript (strict, ESM) + Vite 8 + zustand 5 (existing). Added: `electron`, `electron-builder`, `vite-plugin-electron`, `vitest`. Telemetry server, fs tree reader, and transcript tailer use Node built-ins only.

**Spec:** `docs/superpowers/specs/2026-06-13-forkcode-electron-live-agents-design.md`. This plan covers **v1 (core)** only; Whiteboard/Kanban (Phase 2) and Vault (Phase 3) are separate plans.

**Conventions for every task:** run `npm run lint` before each commit; commit messages use Conventional Commits. The renderer must keep compiling and running in a plain browser (`npm run dev` then open the Vite URL) AND inside Electron — so all `window.forkcode` access is feature-detected.

---

## File structure (created / modified in v1)

**New — Electron main side (`electron/`, bundled to `dist-electron/` as CJS):**
- `electron/main.ts` — BrowserWindow, dev/prod load, IPC handlers, starts server + tailer, forwards events.
- `electron/preload.ts` — `contextBridge` exposing `window.forkcode`.
- `electron/server.ts` — loopback HTTP server (pure, tested).
- `electron/fs-tree.ts` — read directory → `FileNode[]` (pure, tested).
- `electron/hooks-config.ts` — idempotent merge of ForkCode hooks into a settings object (pure, tested).
- `electron/transcript-tailer.ts` — parse session JSONL → activity + backfill (pure parse fn tested).
- `electron/settings-io.ts` — locate + read/write `.claude/settings.json` (thin fs wrapper).
- `tsconfig.electron.json` — TS config for the main/preload sources.

**New — renderer shared logic (`src/`):**
- `src/telemetry/types.ts` — `AgentEvent` union, `RawHookBody`.
- `src/telemetry/roles.ts` — role → station/pose mapping (pure, tested).
- `src/telemetry/normalize.ts` — raw hook body → `AgentEvent` (pure, tested).
- `src/state/reducer.ts` — pure `applyEvent` / `reapEnded` over the agents slice (tested).
- `src/electron.d.ts` — ambient `Window.forkcode` typing for the renderer.
- `src/hooks/useForkcodeEvents.ts` — subscribe to events (or demo sim) → store.
- `src/hooks/useProjectTree.ts` — load real tree via IPC with static fallback.

**Modified — renderer:**
- `src/state/types.ts` — add `LiveAgent`, `TodoItem`; widen `FileNode` with `path`.
- `src/state/store.ts` — dynamic agents keyed by id; uses reducer; connection + demo state.
- `src/scene/layout.ts` — station zone centers + `positionInZone`.
- `src/scene/parts/AgentsLayer.tsx` — render dynamic agents, cluster per station, animate.
- `src/scene/parts/AgentsLayer.css` — spawn/despawn keyframes.
- `src/components/Explorer.tsx` — render real tree (IPC) with static fallback.
- `src/components/BottomPanel.tsx` — task sidebar from `LiveAgent`; dynamic agent menu; empty state.
- `src/components/SystemOverview.tsx` — pins + count from dynamic agents.
- `src/components/StatusBar.tsx` — live connection pill.
- `src/App.tsx` — use `useForkcodeEvents` + `useProjectTree`; demo toggle.

**Modified — build config:**
- `package.json` — deps, scripts, `"main"`, `"build"` (electron-builder).
- `vite.config.ts` — add `vite-plugin-electron/simple`.

---

# PART A — Foundation (Electron shell + real read-only tree + packaging)

At the end of Part A: an installable `ForkCode.app` that opens a real folder, shows its real tree read-only, with the office still driven by the existing simulation (now reachable as "Demo Mode" in Part B). No agent rewrite yet.

---

### Task A1: Add Electron + Vitest tooling and launch the existing app in Electron

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `tsconfig.electron.json`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/lib/smoke.ts`
- Test: `src/lib/smoke.test.ts`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm i -D electron@^42 electron-builder@^26 vite-plugin-electron@^1 vitest@^4
```
Expected: installs without peer-dep errors; `package.json` devDependencies now list all four.

- [ ] **Step 2: Write a trivial failing test to prove the runner works**

Create `src/lib/smoke.test.ts`:
```ts
import { expect, test } from 'vitest'
import { ping } from './smoke'

test('ping returns pong', () => {
  expect(ping()).toBe('pong')
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run src/lib/smoke.test.ts`
Expected: FAIL — `Cannot find module './smoke'`.

- [ ] **Step 4: Implement the module**

Create `src/lib/smoke.ts`:
```ts
export function ping(): string {
  return 'pong'
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx vitest run src/lib/smoke.test.ts`
Expected: PASS (1 passed).

- [ ] **Step 6: Add the Electron main process**

Create `electron/main.ts`:
```ts
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0e1116',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Placeholder IPC so the preload bridge has something to call (replaced in A3).
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return canceled ? '' : filePaths[0]
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

- [ ] **Step 7: Add a minimal preload bridge**

Create `electron/preload.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
```

- [ ] **Step 8: Wire the Electron plugin into Vite**

Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: { entry: 'electron/main.ts' },
      preload: { input: 'electron/preload.ts' },
      renderer: {},
    }),
  ],
})
```

- [ ] **Step 9: Add the Electron TS config**

Create `tsconfig.electron.json`:
```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "types": ["node"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["electron"]
}
```

- [ ] **Step 10: Update package.json scripts, main entry, and type-check wiring**

In `package.json` set `"main"` and scripts:
```jsonc
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "dist": "npm run build && electron-builder"
  }
}
```
(Note: `vite-plugin-electron` auto-launches Electron when you run `vite`. The `"main"` points at the CJS bundle the plugin emits — this is the key ESM-vs-CJS mitigation; do not change main output to ESM.)

- [ ] **Step 11: Launch and verify the existing app runs in Electron**

Run: `npm run dev`
Expected: a frameless desktop window opens showing the current SAMS UI (TitleBar, office, panels) identical to the browser version; DevTools opens detached; no preload errors in the console.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.electron.json electron/ src/lib/
git commit -m "feat: add electron shell + vitest tooling; launch existing app in a window"
```

---

### Task A2: Real filesystem tree reader (pure, TDD)

**Files:**
- Create: `electron/fs-tree.ts`
- Test: `electron/fs-tree.test.ts`

- [ ] **Step 1: Write the failing test**

Create `electron/fs-tree.test.ts`:
```ts
import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readTree } from './fs-tree'

let root: string

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forkcode-tree-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src', 'a.ts'), 'x')
  writeFileSync(join(root, 'README.md'), 'x')
  mkdirSync(join(root, 'node_modules'))
  writeFileSync(join(root, 'node_modules', 'junk.js'), 'x')
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('lists folders before files, ignores node_modules', () => {
  const tree = readTree(root)
  const names = tree.map((n) => n.name)
  expect(names).toEqual(['src', 'README.md'])
  expect(tree[0].type).toBe('folder')
  expect(tree[0].children?.map((c) => c.name)).toEqual(['a.ts'])
})

test('every node carries an absolute path', () => {
  const tree = readTree(root)
  expect(tree[0].path).toBe(join(root, 'src'))
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run electron/fs-tree.test.ts`
Expected: FAIL — `Cannot find module './fs-tree'`.

- [ ] **Step 3: Implement the reader**

Create `electron/fs-tree.ts`:
```ts
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface FileNode {
  name: string
  path: string
  type: 'folder' | 'file'
  children?: FileNode[]
}

const IGNORE = new Set(['node_modules', '.git', 'dist', 'dist-electron', '.DS_Store', 'release'])

export function readTree(root: string, maxDepth = 7): FileNode[] {
  const walk = (dir: string, depth: number): FileNode[] => {
    if (depth > maxDepth) return []
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return []
    }
    const nodes: FileNode[] = []
    for (const name of entries) {
      if (IGNORE.has(name)) continue
      const full = join(dir, name)
      let isDir = false
      try {
        isDir = statSync(full).isDirectory()
      } catch {
        continue
      }
      nodes.push(
        isDir
          ? { name, path: full, type: 'folder', children: walk(full, depth + 1) }
          : { name, path: full, type: 'file' },
      )
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }
  return walk(root, 0)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run electron/fs-tree.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add electron/fs-tree.ts electron/fs-tree.test.ts
git commit -m "feat: read-only filesystem tree reader"
```

---

### Task A3: Wire openFolder + readTree through IPC

**Files:**
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`

- [ ] **Step 1: Add a tree IPC handler in main**

In `electron/main.ts`, add the import and handler (next to the existing `dialog:openFolder` handler):
```ts
import { readTree } from './fs-tree'

ipcMain.handle('fs:readTree', async (_e, root: string) => {
  if (!root) return []
  return readTree(root)
})
```

- [ ] **Step 2: Expose it from preload**

In `electron/preload.ts`, extend the `api` object:
```ts
import { contextBridge, ipcRenderer } from 'electron'
import type { FileNode } from './fs-tree'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
  readTree: (root: string): Promise<FileNode[]> => ipcRenderer.invoke('fs:readTree', root),
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
```

- [ ] **Step 3: Manually verify the round trip**

Run: `npm run dev`. In the detached DevTools console:
```js
const dir = await window.forkcode.openFolder()
console.log(dir)
const tree = await window.forkcode.readTree(dir)
console.log(tree.length, tree[0])
```
Expected: the native folder picker opens; `dir` is the chosen absolute path; `tree` is a non-empty array of `{name, path, type, children?}` with folders first and `node_modules` absent.

- [ ] **Step 4: Commit**

```bash
git add electron/main.ts electron/preload.ts
git commit -m "feat: expose openFolder + readTree over the preload bridge"
```

---

### Task A4: Renderer reads the real tree (with browser fallback)

**Files:**
- Create: `src/electron.d.ts`
- Modify: `src/state/types.ts`
- Create: `src/hooks/useProjectTree.ts`
- Modify: `src/components/Explorer.tsx`

- [ ] **Step 1: Add ambient typing for `window.forkcode`**

Create `src/electron.d.ts`:
```ts
import type { FileNode as FsFileNode } from '../electron/fs-tree'

declare global {
  interface Window {
    forkcode?: {
      openFolder(): Promise<string>
      readTree(root: string): Promise<FsFileNode[]>
    }
  }
}

export {}
```

- [ ] **Step 2: Widen the renderer `FileNode` with an optional path**

In `src/state/types.ts`, change the `FileNode` interface to add `path`:
```ts
export interface FileNode {
  name: string
  path?: string
  type: 'folder' | 'file'
  icon?: 'agent' | 'flow' | 'env' | 'spatial' | 'yaml' | 'md' | 'license'
  color?: AgentColor
  badge?: 'M' | 'U' | 'check' | 'dot'
  children?: FileNode[]
}
```
(The existing static `TREE` in `src/data/workspace.ts` stays valid — `path` is optional.)

- [ ] **Step 3: Add a hook that loads the real tree or falls back**

Create `src/hooks/useProjectTree.ts`:
```ts
import { useEffect, useState } from 'react'
import type { FileNode } from '../state/types'
import { TREE, WORKSPACE_NAME } from '../data/workspace'

export interface ProjectTree {
  rootName: string
  nodes: FileNode[]
  isReal: boolean
}

const FALLBACK: ProjectTree = { rootName: WORKSPACE_NAME, nodes: TREE, isReal: false }

export function useProjectTree(rootPath: string | null): ProjectTree {
  const [tree, setTree] = useState<ProjectTree>(FALLBACK)

  useEffect(() => {
    const fc = window.forkcode
    if (!fc || !rootPath) {
      setTree(FALLBACK)
      return
    }
    let cancelled = false
    fc.readTree(rootPath).then((nodes) => {
      if (cancelled) return
      const rootName = rootPath.split('/').filter(Boolean).pop() ?? rootPath
      setTree({ rootName, nodes: nodes as FileNode[], isReal: true })
    })
    return () => {
      cancelled = true
    }
  }, [rootPath])

  return tree
}
```

- [ ] **Step 4: Make Explorer render an injected tree**

In `src/components/Explorer.tsx`: remove the `import { TREE, WORKSPACE_NAME } from '../data/workspace'` line, and change the `Explorer` component to accept props and key rows by `path` when present:
```tsx
export function Explorer({ rootName, nodes }: { rootName: string; nodes: FileNode[] }) {
  const [rootOpen, setRootOpen] = useState(true)
  return (
    <div className="ex-root">
      <div className="ex-header">
        <span className="ex-title">EXPLORER</span>
        <button type="button" className="ex-more" aria-label="More actions">
          <MoreIcon />
        </button>
      </div>

      <div className="ex-tree">
        <button
          type="button"
          className="ex-row ex-row-root"
          style={{ paddingLeft: pad(0) }}
          onClick={() => setRootOpen((o) => !o)}
          aria-expanded={rootOpen}
        >
          <ChevronIcon open={rootOpen} />
          <span className="ex-name">{rootName}</span>
        </button>
        {rootOpen && (
          <div className="ex-children">
            {nodes.map((node) => (
              <NodeRow key={node.path ?? node.name} node={node} depth={1} />
            ))}
          </div>
        )}
      </div>

      <div className="ex-pinned">
        <button type="button" className="ex-pinned-header">
          <ChevronIcon open={false} />
          <span>OUTLINE</span>
        </button>
        <button type="button" className="ex-pinned-header">
          <ChevronIcon open={false} />
          <span>TIMELINE</span>
        </button>
      </div>
    </div>
  )
}
```
Also update `FolderRow` and `NodeRow` to key children by `path ?? name`:
```tsx
{open && node.children && (
  <div className="ex-children">
    {node.children.map((child) => (
      <NodeRow key={child.path ?? child.name} node={child} depth={depth + 1} />
    ))}
  </div>
)}
```

- [ ] **Step 5: Feed the tree from App (temporary wiring; folder picker added in A5)**

In `src/App.tsx`, add near the top of the component:
```tsx
import { useState } from 'react'
import { useProjectTree } from './hooks/useProjectTree'
```
and inside `App()` before the return:
```tsx
const [rootPath] = useState<string | null>(null)
const tree = useProjectTree(rootPath)
```
then pass props to Explorer:
```tsx
<Explorer rootName={tree.rootName} nodes={tree.nodes} />
```

- [ ] **Step 6: Verify both environments compile and render**

Run: `npm run build` → expected: `tsc -b` passes, Vite build succeeds.
Run: `npm run dev`, open the Vite URL in a plain browser → expected: the static SAMS-WORKSPACE tree still shows (fallback path, `window.forkcode` undefined). The Electron window also shows the static tree (rootPath still null until A5).

- [ ] **Step 7: Commit**

```bash
git add src/electron.d.ts src/state/types.ts src/hooks/useProjectTree.ts src/components/Explorer.tsx src/App.tsx
git commit -m "feat: Explorer renders an injected tree with static browser fallback"
```

---

### Task A5: Open Folder action

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TitleBar.tsx`

- [ ] **Step 1: Add an Open Folder button to the TitleBar**

In `src/components/TitleBar.tsx`, add a prop and a button. At the top of the right-side button group, add:
```tsx
export function TitleBar({ onOpenFolder }: { onOpenFolder?: () => void }) {
  // ...existing code...
```
and within the right-side controls (before the first ghost icon button) insert:
```tsx
{onOpenFolder && (
  <button type="button" className="tb-iconbtn" aria-label="Open folder" onClick={onOpenFolder}>
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  </button>
)}
```
(If `TitleBar` already accepts no props, this is the new signature; keep the existing markup otherwise unchanged.)

- [ ] **Step 2: Wire the picker in App**

In `src/App.tsx`, change the rootPath state to be settable and add a handler:
```tsx
const [rootPath, setRootPath] = useState<string | null>(null)
const tree = useProjectTree(rootPath)

async function openFolder() {
  const dir = await window.forkcode?.openFolder()
  if (dir) setRootPath(dir)
}
```
and pass it to the TitleBar:
```tsx
<TitleBar onOpenFolder={window.forkcode ? openFolder : undefined} />
```

- [ ] **Step 3: Verify in Electron**

Run: `npm run dev`. Click the folder button in the title bar, pick this repo's folder.
Expected: the Explorer root label changes to `forkcode` and shows the real files (`src`, `electron`, `docs`, `package.json`, …) with folders first and `node_modules`/`dist` absent. File rows show no content on click (no editor). In a plain browser the button is absent and the static tree remains.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/TitleBar.tsx
git commit -m "feat: Open Folder action loads a real project tree"
```

---

### Task A6: Package a macOS .dmg

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add electron-builder config**

In `package.json`, add a top-level `"build"` block:
```jsonc
"build": {
  "appId": "com.forkcode.app",
  "productName": "ForkCode",
  "directories": { "output": "release/${version}" },
  "files": ["dist/**/*", "dist-electron/**/*"],
  "mac": {
    "target": "dmg",
    "category": "public.app-category.developer-tools"
  }
}
```

- [ ] **Step 2: Ignore build output**

Append to `.gitignore`:
```
release
dist-electron
```

- [ ] **Step 3: Build the installer**

Run: `npm run dist`
Expected: `tsc -b` + `vite build` produce `dist/` and `dist-electron/`; electron-builder emits `release/0.0.0/ForkCode-0.0.0.dmg` (or `.dmg` under `release/<version>/`). Warnings about code signing/identity are expected and fine for personal use.

- [ ] **Step 4: Smoke-test the packaged app**

Open the produced `.dmg`, drag ForkCode to Applications, launch it.
Expected: the app opens (Gatekeeper may require right-click → Open the first time since it is unsigned); the SAMS UI renders; Open Folder works on a real directory. This catches the classic "blank window when `files` misses an output dir" gotcha.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "build: package ForkCode as a macOS dmg via electron-builder"
```

---

# PART B — Live Agents (telemetry + dynamic office)

At the end of Part B: with the hooks installed in a project, running Claude Code there makes real subagents appear in the office in real time and leave when they finish; the BottomPanel, SystemOverview and StatusBar reflect real state; Demo Mode reproduces the old simulation on demand.

---

### Task B1: Telemetry types + role mapping (pure, TDD)

**Files:**
- Modify: `src/state/types.ts`
- Create: `src/telemetry/types.ts`
- Create: `src/telemetry/roles.ts`
- Test: `src/telemetry/roles.test.ts`

- [ ] **Step 1: Add shared renderer types**

In `src/state/types.ts`, add at the end:
```ts
export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm: string
}

export interface LiveAgent {
  id: string
  role: string
  color: AgentColor
  status: AgentStatus
  pose: AgentPose
  station: AgentLocation
  task: string | null
  activity: string | null
  startedAt: number
  endedAt?: number
}
```

- [ ] **Step 2: Add the event union**

Create `src/telemetry/types.ts`:
```ts
import type { TodoItem } from '../state/types'

export interface AgentStartEvent {
  kind: 'agent:start'
  agentId: string
  role: string
  instructions: string | null
  cwd: string
  sessionId: string
  ts: number
}
export interface AgentStopEvent {
  kind: 'agent:stop'
  agentId: string
  cwd: string
  ts: number
}
export interface AgentActivityEvent {
  kind: 'agent:activity'
  agentId: string
  tool: string
  summary: string
  cwd: string
  ts: number
}
export interface TodosEvent {
  kind: 'todos:update'
  items: TodoItem[]
  cwd: string
  sessionId: string
  ts: number
}

export type AgentEvent = AgentStartEvent | AgentStopEvent | AgentActivityEvent | TodosEvent

/** Loosely-typed JSON body as received from a hook POST. */
export type RawHookBody = Record<string, unknown>
```

- [ ] **Step 3: Write the failing roles test**

Create `src/telemetry/roles.test.ts`:
```ts
import { expect, test } from 'vitest'
import { poseForRole, stationForRole } from './roles'

test('known roles map to their station and pose', () => {
  expect(stationForRole('Ingeniero')).toBe('whiteboard')
  expect(poseForRole('Ingeniero')).toBe('point')
  expect(stationForRole('Desarrollador')).toBe('desk')
  expect(poseForRole('Desarrollador')).toBe('sit')
  expect(stationForRole('Tester')).toBe('gate')
  expect(stationForRole('Analista')).toBe('lounge')
})

test('role matching is case-insensitive and tolerates suffixes', () => {
  expect(stationForRole('ingeniero (pensar)')).toBe('whiteboard')
})

test('unknown roles fall back to the floor', () => {
  expect(stationForRole('general-purpose')).toBe('floor')
  expect(poseForRole('general-purpose')).toBe('stand')
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/telemetry/roles.test.ts`
Expected: FAIL — `Cannot find module './roles'`.

- [ ] **Step 5: Implement the mapping**

Create `src/telemetry/roles.ts`:
```ts
import type { AgentLocation, AgentPose } from '../state/types'

export interface RoleConfig {
  station: AgentLocation
  pose: AgentPose
}

export const DEFAULT_ROLE_MAP: Record<string, RoleConfig> = {
  Ingeniero: { station: 'whiteboard', pose: 'point' },
  Desarrollador: { station: 'desk', pose: 'sit' },
  Tester: { station: 'gate', pose: 'stand' },
  Analista: { station: 'lounge', pose: 'sit' },
}

const FALLBACK: RoleConfig = { station: 'floor', pose: 'stand' }

function lookup(role: string): RoleConfig {
  const lower = role.toLowerCase()
  const key = Object.keys(DEFAULT_ROLE_MAP).find((k) => lower.startsWith(k.toLowerCase()))
  return key ? DEFAULT_ROLE_MAP[key] : FALLBACK
}

export function stationForRole(role: string): AgentLocation {
  return lookup(role).station
}
export function poseForRole(role: string): AgentPose {
  return lookup(role).pose
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npx vitest run src/telemetry/roles.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 7: Commit**

```bash
git add src/state/types.ts src/telemetry/types.ts src/telemetry/roles.ts src/telemetry/roles.test.ts
git commit -m "feat: telemetry event types + role-to-station mapping"
```

---

### Task B2: Hook payload normalizer (pure, TDD)

**Files:**
- Create: `src/telemetry/normalize.ts`
- Test: `src/telemetry/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/telemetry/normalize.test.ts`:
```ts
import { expect, test } from 'vitest'
import { normalize } from './normalize'

const NOW = 1000

test('normalizes SubagentStart', () => {
  const ev = normalize('/agent/start', {
    agent_id: 'a1',
    agent_type: 'Desarrollador',
    subagent_instructions: 'Build the login form',
    cwd: '/proj',
    session_id: 's1',
  }, NOW)
  expect(ev).toEqual({
    kind: 'agent:start',
    agentId: 'a1',
    role: 'Desarrollador',
    instructions: 'Build the login form',
    cwd: '/proj',
    sessionId: 's1',
    ts: NOW,
  })
})

test('SubagentStart without agent_id is ignored', () => {
  expect(normalize('/agent/start', { agent_type: 'X' }, NOW)).toBeNull()
})

test('normalizes SubagentStop', () => {
  const ev = normalize('/agent/stop', { agent_id: 'a1', cwd: '/proj' }, NOW)
  expect(ev).toEqual({ kind: 'agent:stop', agentId: 'a1', cwd: '/proj', ts: NOW })
})

test('normalizes PostToolUse:TodoWrite', () => {
  const ev = normalize('/tool-use', {
    cwd: '/proj',
    session_id: 's1',
    tool_input: { todos: [{ content: 'A', status: 'in_progress', activeForm: 'Doing A' }] },
  }, NOW)
  expect(ev).toEqual({
    kind: 'todos:update',
    items: [{ content: 'A', status: 'in_progress', activeForm: 'Doing A' }],
    cwd: '/proj',
    sessionId: 's1',
    ts: NOW,
  })
})

test('unknown endpoint or malformed body is ignored', () => {
  expect(normalize('/nope', {}, NOW)).toBeNull()
  expect(normalize('/tool-use', { tool_input: {} }, NOW)).toBeNull()
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/telemetry/normalize.test.ts`
Expected: FAIL — `Cannot find module './normalize'`.

- [ ] **Step 3: Implement the normalizer**

Create `src/telemetry/normalize.ts`:
```ts
import type { AgentEvent, RawHookBody } from './types'
import type { TodoItem } from '../state/types'

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function normalize(endpoint: string, raw: RawHookBody, now: number): AgentEvent | null {
  switch (endpoint) {
    case '/agent/start': {
      const id = raw.agent_id
      if (typeof id !== 'string' || !id) return null
      return {
        kind: 'agent:start',
        agentId: id,
        role: str(raw.agent_type, 'general-purpose'),
        instructions: typeof raw.subagent_instructions === 'string' ? raw.subagent_instructions : null,
        cwd: str(raw.cwd),
        sessionId: str(raw.session_id),
        ts: now,
      }
    }
    case '/agent/stop': {
      const id = raw.agent_id
      if (typeof id !== 'string' || !id) return null
      return { kind: 'agent:stop', agentId: id, cwd: str(raw.cwd), ts: now }
    }
    case '/tool-use': {
      const input = raw.tool_input as { todos?: unknown } | undefined
      const todos = input?.todos
      if (!Array.isArray(todos) || todos.length === 0) return null
      const items: TodoItem[] = todos.map((t) => {
        const todo = t as Record<string, unknown>
        return {
          content: str(todo.content),
          status: (str(todo.status, 'pending') as TodoItem['status']),
          activeForm: str(todo.activeForm),
        }
      })
      return { kind: 'todos:update', items, cwd: str(raw.cwd), sessionId: str(raw.session_id), ts: now }
    }
    default:
      return null
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/telemetry/normalize.test.ts`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add src/telemetry/normalize.ts src/telemetry/normalize.test.ts
git commit -m "feat: normalize raw hook payloads into agent events"
```

---

### Task B3: Loopback telemetry server (pure, TDD)

**Files:**
- Create: `electron/server.ts`
- Test: `electron/server.test.ts`

- [ ] **Step 1: Write the failing test**

Create `electron/server.test.ts`:
```ts
import { afterEach, expect, test } from 'vitest'
import type { Server } from 'node:http'
import { startServer } from './server'

let server: Server | undefined
afterEach(() => server?.close())

function addrPort(s: Server): number {
  const a = s.address()
  if (a && typeof a === 'object') return a.port
  throw new Error('no port')
}

test('parses a POST body and reports endpoint + JSON', async () => {
  const received: Array<{ endpoint: string; body: unknown }> = []
  server = startServer({ port: 0, onBody: (endpoint, body) => received.push({ endpoint, body }) })
  await new Promise((r) => server!.on('listening', r))
  const port = addrPort(server)

  await fetch(`http://127.0.0.1:${port}/agent/start`, {
    method: 'POST',
    body: JSON.stringify({ agent_id: 'a1' }),
  })

  expect(received).toEqual([{ endpoint: '/agent/start', body: { agent_id: 'a1' } }])
})

test('malformed JSON does not throw', async () => {
  server = startServer({ port: 0, onBody: () => { throw new Error('should not be called') } })
  await new Promise((r) => server!.on('listening', r))
  const port = addrPort(server)
  const res = await fetch(`http://127.0.0.1:${port}/x`, { method: 'POST', body: '{not json' })
  expect(res.status).toBe(204)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run electron/server.test.ts`
Expected: FAIL — `Cannot find module './server'`.

- [ ] **Step 3: Implement the server**

Create `electron/server.ts`:
```ts
import { createServer, type Server } from 'node:http'

export interface ServerOptions {
  port: number
  onBody: (endpoint: string, body: unknown) => void
}

export function startServer(opts: ServerOptions): Server {
  const server = createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end()
      return
    }
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 5_000_000) req.destroy() // guard against runaway bodies
    })
    req.on('end', () => {
      try {
        const body = data ? JSON.parse(data) : {}
        opts.onBody(req.url ?? '', body)
      } catch {
        // ignore malformed payloads
      }
      res.writeHead(204).end()
    })
  })
  server.listen(opts.port, '127.0.0.1')
  return server
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run electron/server.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add electron/server.ts electron/server.test.ts
git commit -m "feat: loopback HTTP telemetry server"
```

---

### Task B4: Idempotent hook-config merge (pure, TDD)

**Files:**
- Create: `electron/hooks-config.ts`
- Test: `electron/hooks-config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `electron/hooks-config.test.ts`:
```ts
import { expect, test } from 'vitest'
import { hooksInstalled, installHooks, uninstallHooks } from './hooks-config'

test('install adds the three forkcode hooks', () => {
  const next = installHooks({}, 4517)
  expect(Object.keys(next.hooks)).toEqual(expect.arrayContaining(['SubagentStart', 'SubagentStop', 'PostToolUse']))
  expect(hooksInstalled(next)).toBe(true)
  const cmd = next.hooks.SubagentStart[0].hooks[0].command
  expect(cmd).toContain('127.0.0.1:4517/agent/start')
})

test('install is idempotent and preserves unrelated hooks', () => {
  const base = {
    hooks: {
      SubagentStart: [{ matcher: '', hooks: [{ type: 'command', command: 'echo mine' }] }],
    },
  }
  const once = installHooks(base, 4517)
  const twice = installHooks(once, 4517)
  // user's own hook survives; forkcode hook appears exactly once
  const cmds = twice.hooks.SubagentStart.flatMap((g: any) => g.hooks.map((h: any) => h.command))
  expect(cmds.filter((c: string) => c === 'echo mine')).toHaveLength(1)
  expect(cmds.filter((c: string) => c.includes('/agent/start'))).toHaveLength(1)
})

test('uninstall removes only forkcode hooks', () => {
  const base = {
    hooks: { SubagentStart: [{ matcher: '', hooks: [{ type: 'command', command: 'echo mine' }] }] },
  }
  const installed = installHooks(base, 4517)
  const removed = uninstallHooks(installed)
  expect(hooksInstalled(removed)).toBe(false)
  const cmds = removed.hooks.SubagentStart.flatMap((g: any) => g.hooks.map((h: any) => h.command))
  expect(cmds).toEqual(['echo mine'])
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run electron/hooks-config.test.ts`
Expected: FAIL — `Cannot find module './hooks-config'`.

- [ ] **Step 3: Implement the merge**

Create `electron/hooks-config.ts`. Forkcode entries are identified by a loopback URL pointing at one of our three paths.
```ts
export interface HookCommand {
  type: 'command'
  command: string
  timeout?: number
}
export interface HookMatcherGroup {
  matcher?: string
  hooks: HookCommand[]
}
export type HooksMap = Record<string, HookMatcherGroup[]>
export interface Settings {
  hooks?: HooksMap
  [k: string]: unknown
}

const PATHS = ['/agent/start', '/agent/stop', '/tool-use']

function isForkcodeGroup(group: HookMatcherGroup): boolean {
  return (group.hooks ?? []).some(
    (h) => typeof h.command === 'string' && h.command.includes('127.0.0.1') && PATHS.some((p) => h.command.includes(p)),
  )
}

export function forkcodeHooks(port: number): HooksMap {
  const post = (path: string): HookCommand => ({
    type: 'command',
    command: `curl -s -X POST -d @- http://127.0.0.1:${port}${path}`,
    timeout: 10,
  })
  return {
    SubagentStart: [{ matcher: '', hooks: [post('/agent/start')] }],
    SubagentStop: [{ matcher: '', hooks: [post('/agent/stop')] }],
    PostToolUse: [{ matcher: 'TodoWrite', hooks: [post('/tool-use')] }],
  }
}

export function installHooks(settings: Settings, port: number): Settings {
  const next: Settings = { ...settings }
  const hooks: HooksMap = { ...(next.hooks ?? {}) }
  const fc = forkcodeHooks(port)
  for (const [event, groups] of Object.entries(fc)) {
    const kept = (hooks[event] ?? []).filter((g) => !isForkcodeGroup(g))
    hooks[event] = [...kept, ...groups]
  }
  next.hooks = hooks
  return next
}

export function uninstallHooks(settings: Settings): Settings {
  const next: Settings = { ...settings }
  const hooks: HooksMap = { ...(next.hooks ?? {}) }
  for (const event of Object.keys(hooks)) {
    hooks[event] = hooks[event].filter((g) => !isForkcodeGroup(g))
    if (hooks[event].length === 0) delete hooks[event]
  }
  next.hooks = hooks
  return next
}

export function hooksInstalled(settings: Settings): boolean {
  const hooks = settings.hooks ?? {}
  return Object.values(hooks).some((groups) => groups.some(isForkcodeGroup))
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run electron/hooks-config.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add electron/hooks-config.ts electron/hooks-config.test.ts
git commit -m "feat: idempotent merge/remove of forkcode hooks in settings"
```

---

### Task B5: Agents-slice reducer (pure, TDD)

**Files:**
- Create: `src/state/reducer.ts`
- Test: `src/state/reducer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/state/reducer.test.ts`:
```ts
import { expect, test } from 'vitest'
import { applyEvent, emptyAgentsSlice, reapEnded } from './reducer'
import type { AgentStartEvent } from '../telemetry/types'

function start(id: string, role: string, ts = 1): AgentStartEvent {
  return { kind: 'agent:start', agentId: id, role, instructions: 't-' + id, cwd: '/p', sessionId: 's', ts }
}

test('agent:start spawns an agent with a station, pose, color', () => {
  const s = applyEvent(emptyAgentsSlice(), start('a1', 'Ingeniero'))
  expect(s.agents.a1.station).toBe('whiteboard')
  expect(s.agents.a1.pose).toBe('point')
  expect(s.agents.a1.status).toBe('working')
  expect(s.agents.a1.color).toBe('blue') // first arrival → first palette color
  expect(s.order).toEqual(['a1'])
})

test('colors cycle by arrival order and are stable', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, start('a2', 'Tester'))
  expect(s.agents.a1.color).toBe('blue')
  expect(s.agents.a2.color).toBe('green')
})

test('duplicate start is ignored (idempotent)', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, start('a1', 'Tester'))
  expect(s.order).toEqual(['a1'])
})

test('agent:stop marks success + endedAt but keeps the agent', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:stop', agentId: 'a1', cwd: '/p', ts: 5 })
  expect(s.agents.a1.status).toBe('success')
  expect(s.agents.a1.endedAt).toBe(5)
})

test('agent:activity updates the activity line', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:activity', agentId: 'a1', tool: 'Bash', summary: 'npm test', cwd: '/p', ts: 6 })
  expect(s.agents.a1.activity).toBe('npm test')
})

test('todos:update replaces the todo list', () => {
  const s = applyEvent(emptyAgentsSlice(), {
    kind: 'todos:update',
    items: [{ content: 'A', status: 'pending', activeForm: 'Doing A' }],
    cwd: '/p',
    sessionId: 's',
    ts: 7,
  })
  expect(s.todos).toHaveLength(1)
})

test('reapEnded drops agents whose grace window has elapsed', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:stop', agentId: 'a1', cwd: '/p', ts: 100 })
  expect(Object.keys(reapEnded(s, 100 + 1400, 1500).agents)).toEqual(['a1']) // still within grace
  expect(Object.keys(reapEnded(s, 100 + 1600, 1500).agents)).toEqual([]) // past grace
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/state/reducer.test.ts`
Expected: FAIL — `Cannot find module './reducer'`.

- [ ] **Step 3: Implement the reducer**

Create `src/state/reducer.ts`:
```ts
import type { AgentColor, LiveAgent, TodoItem } from './types'
import type { AgentEvent } from '../telemetry/types'
import { poseForRole, stationForRole } from '../telemetry/roles'

export interface AgentsSlice {
  agents: Record<string, LiveAgent>
  order: string[]
  todos: TodoItem[]
}

export const PALETTE: AgentColor[] = ['blue', 'green', 'orange', 'purple', 'red', 'yellow']

export function emptyAgentsSlice(): AgentsSlice {
  return { agents: {}, order: [], todos: [] }
}

export function applyEvent(slice: AgentsSlice, ev: AgentEvent): AgentsSlice {
  switch (ev.kind) {
    case 'agent:start': {
      if (slice.agents[ev.agentId]) return slice
      const color = PALETTE[slice.order.length % PALETTE.length]
      const agent: LiveAgent = {
        id: ev.agentId,
        role: ev.role,
        color,
        status: 'working',
        pose: poseForRole(ev.role),
        station: stationForRole(ev.role),
        task: ev.instructions,
        activity: null,
        startedAt: ev.ts,
      }
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: agent }, order: [...slice.order, ev.agentId] }
    }
    case 'agent:stop': {
      const a = slice.agents[ev.agentId]
      if (!a) return slice
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: { ...a, status: 'success', endedAt: ev.ts } } }
    }
    case 'agent:activity': {
      const a = slice.agents[ev.agentId]
      if (!a) return slice
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: { ...a, activity: ev.summary } } }
    }
    case 'todos:update':
      return { ...slice, todos: ev.items }
  }
}

/** Remove agents that stopped more than graceMs ago. Color stability is preserved
 *  for survivors because `order` keeps their original arrival index untouched only
 *  while they live; reaping compacts both maps together. */
export function reapEnded(slice: AgentsSlice, now: number, graceMs: number): AgentsSlice {
  const ids = Object.keys(slice.agents)
  const survivors = ids.filter((id) => {
    const ended = slice.agents[id].endedAt
    return ended === undefined || now - ended < graceMs
  })
  if (survivors.length === ids.length) return slice
  const agents: Record<string, LiveAgent> = {}
  for (const id of survivors) agents[id] = slice.agents[id]
  return { ...slice, agents, order: slice.order.filter((id) => agents[id]) }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/state/reducer.test.ts`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
git add src/state/reducer.ts src/state/reducer.test.ts
git commit -m "feat: pure agents-slice reducer (spawn/stop/activity/todos/reap)"
```

---

### Task B6: Station layout helpers (pure, TDD)

**Files:**
- Modify: `src/scene/layout.ts`
- Test: `src/scene/layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/scene/layout.test.ts`:
```ts
import { expect, test } from 'vitest'
import { STATION_ZONES, positionInZone } from './layout'

test('every station has a zone center', () => {
  for (const s of ['whiteboard', 'desk', 'gate', 'lounge', 'floor'] as const) {
    expect(STATION_ZONES[s]).toBeDefined()
  }
})

test('a single agent sits exactly at the zone center', () => {
  const c = STATION_ZONES.desk
  expect(positionInZone('desk', 0, 1)).toEqual(c)
})

test('multiple agents spread symmetrically around the center', () => {
  const c = STATION_ZONES.floor
  const left = positionInZone('floor', 0, 2)
  const right = positionInZone('floor', 1, 2)
  expect(left.x).toBeLessThan(c.x)
  expect(right.x).toBeGreaterThan(c.x)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/scene/layout.test.ts`
Expected: FAIL — `STATION_ZONES`/`positionInZone` are not exported.

- [ ] **Step 3: Add the helpers**

Append to `src/scene/layout.ts` (keep existing exports). Import `AgentLocation`:
```ts
import type { AgentLocation } from '../state/types'

/** Center floor-contact point of each office station (1160×760 viewBox). */
export const STATION_ZONES: Record<AgentLocation, Pt> = {
  desk: { x: 440, y: 432 },
  whiteboard: iso(0.84, 0.24),
  gate: iso(0.6, 0.84),
  lounge: { x: 352, y: 430 },
  kanban: iso(0.86, 0.7),
  floor: iso(0.5, 0.5),
}

/** Place agent `index` of `count` in a station: a centered horizontal cluster. */
export function positionInZone(station: AgentLocation, index: number, count: number): Pt {
  const c = STATION_ZONES[station]
  if (count <= 1) return c
  const GAP = 46
  const offset = (index - (count - 1) / 2) * GAP
  return { x: c.x + offset, y: c.y + (index % 2 === 1 ? 10 : 0) }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/scene/layout.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add src/scene/layout.ts src/scene/layout.test.ts
git commit -m "feat: station zone centers + clustered agent placement"
```

---

### Task B7: Store switchover to dynamic agents

This is the integration task that swaps the fake 6-agent store for the dynamic reducer-backed store and updates every consumer so the project compiles and runs. Keep the old simulation as Demo Mode.

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/scene/parts/AgentsLayer.tsx`
- Modify: `src/components/BottomPanel.tsx`
- Modify: `src/components/SystemOverview.tsx`
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/App.tsx`
- Create: `src/hooks/useForkcodeEvents.ts`

- [ ] **Step 1: Rewrite the store around the reducer**

Replace the body of `src/state/store.ts`. Keep `AGENT_CSS` exported (many components import it). Remove `AGENT_ORDER`/`initialAgents`/`TASKS`/`SIM_POOL` from the live path; keep a self-contained demo simulation. New store:
```ts
import { useEffect } from 'react'
import { create } from 'zustand'
import type { AgentColor, BottomTab, LiveAgent, LogEntry, LogLevel, TodoItem } from './types'
import { applyEvent as reduce, emptyAgentsSlice, reapEnded } from './reducer'
import type { AgentEvent } from '../telemetry/types'

export const AGENT_CSS: Record<AgentColor, string> = {
  blue: 'var(--agent-blue)',
  green: 'var(--agent-green)',
  orange: 'var(--agent-orange)',
  purple: 'var(--agent-purple)',
  red: 'var(--agent-red)',
  yellow: 'var(--agent-yellow)',
}

const REAP_GRACE_MS = 1500

function clock(): string {
  // Wall-clock HH:MM:SS for log stamps (renderer side; Date is fine here).
  return new Date().toTimeString().slice(0, 8)
}

let nextLogId = 1
function makeLog(agent: AgentColor, level: LogLevel, message: string): LogEntry {
  return { id: nextLogId++, time: clock(), agent, level, message }
}

interface ForkcodeStore {
  agents: Record<string, LiveAgent>
  order: string[]
  todos: TodoItem[]
  logs: LogEntry[]
  selected: string | null
  radialFor: string | null
  paletteOpen: boolean
  paletteQuery: string
  bottomTab: BottomTab
  zoom: number
  problems: number
  connected: boolean
  demo: boolean
  // actions
  applyEvent: (ev: AgentEvent) => void
  reap: () => void
  setConnected: (c: boolean) => void
  setDemo: (d: boolean) => void
  selectAgent: (id: string) => void
  setRadial: (id: string | null) => void
  setPalette: (open: boolean) => void
  setPaletteQuery: (q: string) => void
  setBottomTab: (t: BottomTab) => void
  setZoom: (z: number) => void
  pushLog: (agent: AgentColor, level: LogLevel, message: string) => void
  runGateAction: (id: string) => void
  runRadialAction: (id: string) => void
  runCommand: (id: string) => void
}

export const useStore = create<ForkcodeStore>((set, get) => ({
  ...emptyAgentsSlice(),
  logs: [],
  selected: null,
  radialFor: null,
  paletteOpen: true,
  paletteQuery: '',
  bottomTab: 'terminal',
  zoom: 100,
  problems: 2,
  connected: false,
  demo: false,

  applyEvent: (ev) =>
    set((s) => {
      const slice = reduce({ agents: s.agents, order: s.order, todos: s.todos }, ev)
      let logs = s.logs
      if (ev.kind === 'agent:start') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'INFO', `Spawned ${a.role}: ${a.task ?? '—'}`)]
      } else if (ev.kind === 'agent:stop') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'SUCCESS', `${a.role} finished`)]
      } else if (ev.kind === 'agent:activity') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'INFO', ev.summary)]
      }
      const selected = s.selected && slice.agents[s.selected] ? s.selected : (slice.order[0] ?? null)
      return { ...slice, logs, selected, radialFor: selected }
    }),

  reap: () => set((s) => reapEnded({ agents: s.agents, order: s.order, todos: s.todos }, Date.now(), REAP_GRACE_MS)),

  setConnected: (c) => set({ connected: c }),
  setDemo: (d) => set({ demo: d }),
  selectAgent: (id) => set({ selected: id, radialFor: id }),
  setRadial: (id) => set({ radialFor: id }),
  setPalette: (open) => set((s) => ({ paletteOpen: open, paletteQuery: open ? s.paletteQuery : '' })),
  setPaletteQuery: (q) => set({ paletteQuery: q }),
  setBottomTab: (t) => set({ bottomTab: t }),
  setZoom: (z) => set({ zoom: Math.min(140, Math.max(60, Math.round(z))) }),
  pushLog: (agent, level, message) => set((s) => ({ logs: [...s.logs.slice(-200), makeLog(agent, level, message)] })),

  runGateAction: () => {},
  runRadialAction: () => {},
  runCommand: (id) => {
    const s = get()
    s.setPalette(false)
    if (id === 'toggle-terminal') s.setBottomTab('terminal')
  },
}))
```
(Note: `runGateAction`/`runRadialAction` are intentionally trimmed to no-ops in v1 — the gate/radial UI still renders but its actions belong to a later phase. If `GATE_LOGS`/`RADIAL_LOGS` imports are now unused elsewhere, leave those data files in place; they are referenced by the radial/gate components for labels only.)

- [ ] **Step 2: Add the event source hook (real events or demo)**

Create `src/hooks/useForkcodeEvents.ts`:
```ts
import { useEffect } from 'react'
import { useStore } from '../state/store'
import type { AgentEvent } from '../telemetry/types'

const DEMO_ROLES = ['Ingeniero', 'Desarrollador', 'Tester', 'Analista', 'Desarrollador']

/** Subscribe to real telemetry from Electron, or run a demo when toggled on. */
export function useForkcodeEvents() {
  const applyEvent = useStore((s) => s.applyEvent)
  const reap = useStore((s) => s.reap)
  const setConnected = useStore((s) => s.setConnected)
  const demo = useStore((s) => s.demo)

  // real events
  useEffect(() => {
    const fc = window.forkcode
    if (!fc?.onEvent) return
    setConnected(true)
    const unsub = fc.onEvent((ev) => applyEvent(ev as AgentEvent))
    return () => {
      unsub?.()
      setConnected(false)
    }
  }, [applyEvent, setConnected])

  // reap stopped agents on a timer
  useEffect(() => {
    const t = setInterval(reap, 500)
    return () => clearInterval(t)
  }, [reap])

  // demo mode: spawn a few agents, then retire them on a loop
  useEffect(() => {
    if (!demo) return
    let i = 0
    const spawn = () => {
      const id = `demo-${i}`
      applyEvent({ kind: 'agent:start', agentId: id, role: DEMO_ROLES[i % DEMO_ROLES.length], instructions: 'Demo task', cwd: '', sessionId: 'demo', ts: Date.now() })
      const myId = id
      setTimeout(() => applyEvent({ kind: 'agent:stop', agentId: myId, cwd: '', ts: Date.now() }), 6000)
      i++
    }
    spawn()
    const t = setInterval(spawn, 2500)
    return () => clearInterval(t)
  }, [demo, applyEvent])
}
```

- [ ] **Step 3: Update the preload typing in `src/electron.d.ts`**

Extend the `window.forkcode` type with the event channel and connect API:
```ts
import type { FileNode as FsFileNode } from '../electron/fs-tree'
import type { AgentEvent } from './telemetry/types'

declare global {
  interface Window {
    forkcode?: {
      openFolder(): Promise<string>
      readTree(root: string): Promise<FsFileNode[]>
      onEvent(cb: (ev: AgentEvent) => void): () => void
      connectProject(root: string): Promise<{ ok: boolean; port: number }>
      isConnected(root: string): Promise<boolean>
    }
  }
}

export {}
```

- [ ] **Step 4: Rewrite AgentsLayer for dynamic agents**

Replace `src/scene/parts/AgentsLayer.tsx`:
```tsx
import { useStore } from '../../state/store'
import type { LiveAgent } from '../../state/types'
import type { AgentLocation } from '../../state/types'
import { at } from '../iso'
import { positionInZone } from '../layout'
import { AgentBot } from './AgentBot'
import './AgentsLayer.css'

export function AgentsLayer() {
  const agents = useStore((s) => s.agents)
  const order = useStore((s) => s.order)
  const selected = useStore((s) => s.selected)
  const selectAgent = useStore((s) => s.selectAgent)

  // group by station to compute per-station cluster index
  const byStation: Record<string, LiveAgent[]> = {}
  for (const id of order) {
    const a = agents[id]
    if (!a) continue
    ;(byStation[a.station] ??= []).push(a)
  }

  const placed = order
    .map((id) => agents[id])
    .filter(Boolean)
    .map((a) => {
      const group = byStation[a.station]
      const idx = group.indexOf(a)
      const pos = positionInZone(a.station as AgentLocation, idx, group.length)
      return { a, pos }
    })
    .sort((p, q) => p.pos.y - q.pos.y)

  return (
    <g className="ag-layer">
      {placed.map(({ a, pos }, i) => (
        <g key={a.id} className={a.endedAt ? 'ag-spawn ag-leaving' : 'ag-spawn'} transform={at(pos)}>
          <AgentBot
            color={a.color}
            pose={a.pose}
            status={a.status}
            selected={selected === a.id}
            index={i}
            onClick={() => selectAgent(a.id)}
          />
        </g>
      ))}
    </g>
  )
}
```

- [ ] **Step 5: Add spawn/leave animations**

Append to `src/scene/parts/AgentsLayer.css`:
```css
.ag-spawn {
  transform-box: fill-box;
  animation: ag-pop 220ms ease-out both;
}
@keyframes ag-pop {
  from { opacity: 0; transform: translateY(6px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ag-leaving {
  animation: ag-fade 1400ms ease-in forwards;
}
@keyframes ag-fade {
  to { opacity: 0; }
}
```
(Note: the `transform` on the `<g>` element from `at(pos)` and the CSS `transform` animation compose because the wrapper uses `transform-box: fill-box`; if a visual conflict appears, move the positioning `at(pos)` onto an outer `<g>` and the animation class onto an inner `<g>`, mirroring the bob pattern in `AgentBot.tsx`.)

- [ ] **Step 6: Update BottomPanel for dynamic agents + empty state**

In `src/components/BottomPanel.tsx`: replace the `AGENT_ORDER` import usage and the task sidebar. Change the imports line:
```tsx
import { AGENT_CSS, useStore } from '../state/store'
import type { BottomTab, LogLevel } from '../state/types'
```
Change the selectors and derived agent:
```tsx
const agents = useStore((s) => s.agents)
const order = useStore((s) => s.order)
const selected = useStore((s) => s.selected)
const selectAgent = useStore((s) => s.selectAgent)
const agent = selected ? agents[selected] : undefined
```
Replace the agent selector button block (the `bp-agentsel` div) with a null-safe version:
```tsx
<div className="bp-agentsel">
  <button className="bp-agentbtn" onClick={() => setMenuOpen((o) => !o)}>
    <span className="bp-agentdot" style={{ background: agent ? AGENT_CSS[agent.color] : 'var(--text-3)' }} />
    {agent ? agent.role : 'No agents'}
    <span className="bp-chev"><GhostIcon name="chevron-down" /></span>
  </button>
  {menuOpen && order.length > 0 && (
    <div className="bp-agentmenu">
      {order.map((id) => {
        const a = agents[id]
        if (!a) return null
        return (
          <button key={id} className="bp-agentitem" onClick={() => { selectAgent(id); setMenuOpen(false) }}>
            <span className="bp-agentdot" style={{ background: AGENT_CSS[a.color] }} />
            {a.role}
          </button>
        )
      })}
    </div>
  )}
</div>
```
Replace the `bp-task` sidebar block with a `LiveAgent`-shaped version (Task / Role / Status / Activity, no branch/progress):
```tsx
<div className="bp-task">
  {agent ? (
    <>
      <div className="bp-row">
        <span className="bp-label">Task</span>
        <span className="bp-value">{agent.task ?? '—'}</span>
      </div>
      <div className="bp-row">
        <span className="bp-label">Role</span>
        <span className="bp-value">{agent.role}</span>
      </div>
      <div className="bp-row">
        <span className="bp-label">Status</span>
        <span className={`bp-pill ${STATUS_PILL[agent.status].cls}`}>{STATUS_PILL[agent.status].label}</span>
      </div>
      <div className="bp-row">
        <span className="bp-label">Activity</span>
        <span className="bp-value">{agent.activity ?? '—'}</span>
      </div>
    </>
  ) : (
    <div className="bp-row"><span className="bp-value">Office empty — no agents running.</span></div>
  )}
</div>
```
The terminal/eventlog log rendering stays as-is (it reads `l.agent` color and `l.level`). `STATUS_PILL` already covers all four statuses.

- [ ] **Step 7: Update SystemOverview pins + count**

In `src/components/SystemOverview.tsx`: replace the `AGENT_ORDER`/`AGENT_POS` driven pins with dynamic agents at their station positions. Change imports:
```tsx
import { AGENT_CSS, useStore } from '../state/store'
import { iso } from '../scene/iso'
import type { Pt } from '../scene/iso'
import { STATION_ZONES, WALL_H } from '../scene/layout'
```
Add selectors inside the component:
```tsx
const agents = useStore((s) => s.agents)
const order = useStore((s) => s.order)
```
Replace the `AGENT_ORDER.map(...)` pin block with:
```tsx
{order.map((id, i) => {
  const a = agents[id]
  if (!a) return null
  const p = m(STATION_ZONES[a.station])
  return (
    <g key={id} className="so-pin" style={{ '--so-i': i } as CSSProperties} onClick={() => selectAgent(id)}>
      <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 14} stroke="var(--text-3)" strokeWidth={1} />
      <circle className="so-ball" cx={p.x} cy={p.y - 19} r={5.5} fill={AGENT_CSS[a.color]} stroke="#ffffff" strokeWidth={1.5} />
    </g>
  )
})}
```
Replace the footer count:
```tsx
<span className="so-active">
  <span className="so-dot" />
  {order.length} {order.length === 1 ? 'Agent' : 'Agents'} Active
</span>
```

- [ ] **Step 8: Live connection pill in StatusBar**

In `src/components/StatusBar.tsx`, read `connected` and switch the SAMS pill label/color:
```tsx
export function StatusBar() {
  const setBottomTab = useStore((s) => s.setBottomTab)
  const connected = useStore((s) => s.connected)
  // ...
```
Replace the `SAMS: Connected` pill:
```tsx
<button type="button" className="sb-pill">
  <span className="sb-dot" aria-hidden="true" style={{ background: connected ? 'var(--green)' : 'var(--text-3)' }} />
  <span>{connected ? 'SAMS: Connected' : 'SAMS: Disconnected'}</span>
</button>
```

- [ ] **Step 9: Wire App to the event hook + Demo toggle**

In `src/App.tsx`, replace `import { useSimulation } from './state/store'` with:
```tsx
import { useStore } from './state/store'
import { useForkcodeEvents } from './hooks/useForkcodeEvents'
```
In the component body replace `useSimulation()` with:
```tsx
useForkcodeEvents()
const demo = useStore((s) => s.demo)
const setDemo = useStore((s) => s.setDemo)
```
Add a small Demo toggle to the TitleBar call (only when not connected to real events) — pass another prop:
```tsx
<TitleBar onOpenFolder={window.forkcode ? openFolder : undefined} demo={demo} onToggleDemo={() => setDemo(!demo)} />
```
And in `src/components/TitleBar.tsx` accept and render it next to the open-folder button:
```tsx
export function TitleBar({ onOpenFolder, demo, onToggleDemo }: { onOpenFolder?: () => void; demo?: boolean; onToggleDemo?: () => void }) {
  // ...
  {onToggleDemo && (
    <button type="button" className="tb-iconbtn" aria-pressed={demo} aria-label="Toggle demo office" onClick={onToggleDemo}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={demo ? 'var(--accent)' : 'currentColor'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={9} /><path d="M10 9l5 3-5 3z" />
      </svg>
    </button>
  )}
```

- [ ] **Step 10: Type-check, lint, and verify behavior**

Run: `npm run build`
Expected: `tsc -b` passes with no unused-symbol errors (remove any now-dead imports the compiler flags, e.g. `AGENT_ORDER`, `useSimulation`, `useEffect` if unused).
Run: `npm run dev` in a plain browser. Expected: office is EMPTY (no agents, no simulation), StatusBar shows "SAMS: Disconnected". Click the Demo toggle (Electron only) → robots spawn at their stations, animate in, finish and fade after a few seconds; SystemOverview pins and the "N Agents Active" count track them; clicking a robot fills the BottomPanel task sidebar.

- [ ] **Step 11: Commit**

```bash
git add src/state/store.ts src/hooks/useForkcodeEvents.ts src/electron.d.ts src/scene/parts/AgentsLayer.tsx src/scene/parts/AgentsLayer.css src/components/BottomPanel.tsx src/components/SystemOverview.tsx src/components/StatusBar.tsx src/App.tsx src/components/TitleBar.tsx
git commit -m "feat: dynamic agent office driven by telemetry events (+ demo mode)"
```

---

### Task B8: Main-process telemetry wiring + connect-project

**Files:**
- Create: `electron/settings-io.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`

- [ ] **Step 1: Add settings.json IO**

Create `electron/settings-io.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Settings } from './hooks-config'

export function projectSettingsPath(root: string): string {
  return join(root, '.claude', 'settings.json')
}

export function readSettings(file: string): Settings {
  if (!existsSync(file)) return {}
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Settings
  } catch {
    return {}
  }
}

export function writeSettings(file: string, settings: Settings): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(settings, null, 2) + '\n', 'utf8')
}
```

- [ ] **Step 2: Start the server and forward events to the renderer**

In `electron/main.ts`, add imports and wire the server in `createWindow` (capture `win` so events can be pushed). Replace the file's top-level structure so a single `win` reference is reused:
```ts
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { readTree } from './fs-tree'
import { startServer } from './server'
import { normalize } from '../src/telemetry/normalize'
import { installHooks, hooksInstalled } from './hooks-config'
import { projectSettingsPath, readSettings, writeSettings } from './settings-io'

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const PORT = 4517

let mainWindow: BrowserWindow | null = null
let projectRoot = ''

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320, height: 860, minWidth: 1024, minHeight: 680,
    frame: false, backgroundColor: '#0e1116',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// One loopback server for the app's lifetime.
startServer({
  port: PORT,
  onBody: (endpoint, body) => {
    const raw = (body ?? {}) as Record<string, unknown>
    // only forward events for the currently-open project
    if (projectRoot && typeof raw.cwd === 'string' && raw.cwd !== projectRoot) return
    const ev = normalize(endpoint, raw, Date.now())
    if (ev) mainWindow?.webContents.send('app:event', ev)
  },
})

ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (canceled) return ''
  projectRoot = filePaths[0]
  return projectRoot
})

ipcMain.handle('fs:readTree', async (_e, root: string) => {
  if (!root) return []
  projectRoot = root
  return readTree(root)
})

ipcMain.handle('project:connect', async (_e, root: string) => {
  const file = projectSettingsPath(root)
  const next = installHooks(readSettings(file), PORT)
  writeSettings(file, next)
  return { ok: true, port: PORT }
})

ipcMain.handle('project:isConnected', async (_e, root: string) => {
  return hooksInstalled(readSettings(projectSettingsPath(root)))
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```
(Note: importing `../src/telemetry/normalize` into the bundled CJS main is fine — `vite-plugin-electron` bundles it in. The normalizer only imports types from `../state/types`, which are erased, so there is no React/DOM dependency pulled into main.)

- [ ] **Step 3: Expose the event + connect API from preload**

Replace `electron/preload.ts`:
```ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { FileNode } from './fs-tree'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
  readTree: (root: string): Promise<FileNode[]> => ipcRenderer.invoke('fs:readTree', root),
  connectProject: (root: string): Promise<{ ok: boolean; port: number }> =>
    ipcRenderer.invoke('project:connect', root),
  isConnected: (root: string): Promise<boolean> => ipcRenderer.invoke('project:isConnected', root),
  onEvent: (cb: (ev: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, ev: unknown) => cb(ev)
    ipcRenderer.on('app:event', listener)
    return () => ipcRenderer.off('app:event', listener)
  },
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
```

- [ ] **Step 4: Verify the full loop with a manual curl**

Run: `npm run dev`. In the Electron window, Open Folder → pick a directory, e.g. `/tmp/proj`. Then in the **DevTools console**:
```js
await fetch('http://127.0.0.1:4517/agent/start', { method:'POST', body: JSON.stringify({ agent_id:'t1', agent_type:'Tester', subagent_instructions:'probe', cwd: (await window.forkcode.openFolder()) }) })
```
Simpler: connect the project and curl from a terminal with the matching cwd. Expected: a Tester robot appears at the gate; `await fetch('http://127.0.0.1:4517/agent/stop',{method:'POST',body:JSON.stringify({agent_id:'t1',cwd:'<same>'}}))` makes it finish and fade. Events with a non-matching `cwd` are ignored.

- [ ] **Step 5: Commit**

```bash
git add electron/settings-io.ts electron/main.ts electron/preload.ts
git commit -m "feat: telemetry server forwards cwd-filtered events; connect-project installs hooks"
```

---

### Task B9: Transcript tailer — activity enrichment + backfill (TDD on parse)

**Files:**
- Create: `electron/transcript-tailer.ts`
- Test: `electron/transcript-tailer.test.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Write the failing parse test**

Create `electron/transcript-tailer.test.ts`:
```ts
import { expect, test } from 'vitest'
import { parseTranscriptLine, runningAgentsFrom } from './transcript-tailer'

test('parses an Agent tool_use into a running-agent record', () => {
  const line = JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id: 'tu1', name: 'Agent', input: { subagent_type: 'Analista', description: 'review', prompt: 'do it' } }] },
  })
  const rec = parseTranscriptLine(line)
  expect(rec).toEqual({ kind: 'agent_use', toolUseId: 'tu1', role: 'Analista', description: 'review' })
})

test('parses a tool_result for correlation', () => {
  const line = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tu1' }] } })
  expect(parseTranscriptLine(line)).toEqual({ kind: 'tool_result', toolUseId: 'tu1' })
})

test('runningAgentsFrom returns Agent uses without a matching result', () => {
  const lines = [
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'a', name: 'Agent', input: { subagent_type: 'Tester', description: 'x' } }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'b', name: 'Agent', input: { subagent_type: 'Ingeniero', description: 'y' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'a' }] } }),
  ]
  const running = runningAgentsFrom(lines)
  expect(running.map((r) => r.toolUseId)).toEqual(['b'])
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run electron/transcript-tailer.test.ts`
Expected: FAIL — `Cannot find module './transcript-tailer'`.

- [ ] **Step 3: Implement the parser + tailer**

Create `electron/transcript-tailer.ts`:
```ts
import { watch, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentEvent } from '../src/telemetry/types'

export type TranscriptRecord =
  | { kind: 'agent_use'; toolUseId: string; role: string; description: string }
  | { kind: 'tool_result'; toolUseId: string }
  | { kind: 'other' }

export function parseTranscriptLine(line: string): TranscriptRecord {
  let obj: any
  try {
    obj = JSON.parse(line)
  } catch {
    return { kind: 'other' }
  }
  const content = obj?.message?.content
  if (!Array.isArray(content)) return { kind: 'other' }
  for (const block of content) {
    if (block?.type === 'tool_use' && block?.name === 'Agent') {
      return {
        kind: 'agent_use',
        toolUseId: String(block.id ?? ''),
        role: String(block.input?.subagent_type ?? 'general-purpose'),
        description: String(block.input?.description ?? ''),
      }
    }
    if (block?.type === 'tool_result') {
      return { kind: 'tool_result', toolUseId: String(block.tool_use_id ?? '') }
    }
  }
  return { kind: 'other' }
}

/** Agent tool_uses with no matching tool_result = still running (backfill). */
export function runningAgentsFrom(lines: string[]): Array<{ toolUseId: string; role: string; description: string }> {
  const uses = new Map<string, { toolUseId: string; role: string; description: string }>()
  for (const line of lines) {
    const rec = parseTranscriptLine(line)
    if (rec.kind === 'agent_use') uses.set(rec.toolUseId, rec)
    else if (rec.kind === 'tool_result') uses.delete(rec.toolUseId)
  }
  return [...uses.values()]
}

/** Map a Claude project dir to its transcript folder under ~/.claude/projects. */
export function transcriptDirFor(projectRoot: string): string {
  const base = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
  // Claude encodes the project path by replacing slashes with dashes.
  const hash = projectRoot.replace(/\//g, '-')
  return join(base, 'projects', hash)
}

function latestJsonl(dir: string): string | null {
  let entries: string[]
  try {
    entries = readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
  } catch {
    return null
  }
  let best: { f: string; m: number } | null = null
  for (const f of entries) {
    const m = statSync(join(dir, f)).mtimeMs
    if (!best || m > best.m) best = { f, m }
  }
  return best ? join(dir, best.f) : null
}

export interface TailerOptions {
  projectRoot: string
  emit: (ev: AgentEvent) => void
}

/** Backfill running agents from the latest transcript, then watch for activity. */
export function startTailer(opts: TailerOptions): () => void {
  const dir = transcriptDirFor(opts.projectRoot)
  const file = latestJsonl(dir)
  if (!file) return () => {}

  // backfill: synthesize agent:start for still-running agents
  try {
    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
    for (const r of runningAgentsFrom(lines)) {
      opts.emit({ kind: 'agent:start', agentId: r.toolUseId, role: r.role, instructions: r.description, cwd: opts.projectRoot, sessionId: '', ts: Date.now() })
    }
  } catch {
    /* ignore */
  }

  // watch for appended lines → emit activity for tool_use blocks (best-effort)
  let size = (() => {
    try {
      return statSync(file).size
    } catch {
      return 0
    }
  })()
  const watcher = watch(file, () => {
    try {
      const stat = statSync(file)
      if (stat.size <= size) {
        size = stat.size
        return
      }
      const buf = readFileSync(file, 'utf8')
      const fresh = buf.slice(size).split('\n').filter(Boolean)
      size = stat.size
      for (const line of fresh) {
        const rec = parseTranscriptLine(line)
        if (rec.kind === 'agent_use') {
          opts.emit({ kind: 'agent:activity', agentId: rec.toolUseId, tool: 'Agent', summary: rec.description, cwd: opts.projectRoot, ts: Date.now() })
        }
      }
    } catch {
      /* ignore */
    }
  })
  return () => watcher.close()
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run electron/transcript-tailer.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Start the tailer when a project opens**

In `electron/main.ts`, import and (re)start the tailer whenever `projectRoot` changes. Add:
```ts
import { startTailer } from './transcript-tailer'

let stopTailer: (() => void) | null = null
function openProject(root: string) {
  projectRoot = root
  stopTailer?.()
  stopTailer = startTailer({ projectRoot: root, emit: (ev) => mainWindow?.webContents.send('app:event', ev) })
}
```
and call `openProject(...)` in the `dialog:openFolder` and `fs:readTree` handlers instead of assigning `projectRoot` directly:
```ts
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (canceled) return ''
  openProject(filePaths[0])
  return projectRoot
})
ipcMain.handle('fs:readTree', async (_e, root: string) => {
  if (!root) return []
  openProject(root)
  return readTree(root)
})
```

- [ ] **Step 6: End-to-end verification with real Claude Code**

1. In the Electron app, Open Folder on a real repo, then run (via a "Connect this project" action wired to `window.forkcode.connectProject(root)` in the DevTools console for now): `await window.forkcode.connectProject('<repo path>')`. Confirm `.claude/settings.json` now contains the three hooks pointing at `127.0.0.1:4517`.
2. In a terminal at that repo, run Claude Code and give it a task that spawns subagents (e.g. ask it to use a couple of parallel agents).
Expected: as Claude spawns each subagent, a robot of the matching role appears at its station in real time; when each subagent finishes, its robot fades out. The terminal log shows "Spawned …/finished" lines. If ForkCode is opened mid-run, backfill shows the currently-running agents.

- [ ] **Step 7: Commit**

```bash
git add electron/transcript-tailer.ts electron/transcript-tailer.test.ts electron/main.ts
git commit -m "feat: transcript tailer for activity enrichment + mid-session backfill"
```

---

## Self-review notes (addressed)

- **Spec coverage:** Electron packaging (A1, A6), read-only real tree (A2–A5), observer transport A+C (B3 server, B8 wiring, B9 tailer), custom-agent role mapping (B1), dynamic empty/populated office with spawn/despawn (B5–B7), connection status (B7/B8), Demo Mode (B7), idempotent hook install (B4/B8), cwd project filtering (B8). Whiteboard/Kanban/Vault are explicitly out of v1 (separate plans) per spec §15.
- **Known v1 limitations (intentional, noted for the executor):** `.gitignore` is approximated by a static IGNORE set (full parsing deferred); tree is not yet live-watched (refresh on re-open) — `fs.watch`-based tree refresh is a fast-follow; backfill is best-effort (infers running agents from unmatched Agent tool_use). None block v1.
- **Type consistency:** `LiveAgent`, `AgentsSlice`, `AgentEvent`, `Settings`, `FileNode` names are used identically across tasks; `stationForRole`/`poseForRole`, `applyEvent`/`reapEnded`/`emptyAgentsSlice`, `installHooks`/`uninstallHooks`/`hooksInstalled`, `startServer`, `startTailer`/`parseTranscriptLine`/`runningAgentsFrom` signatures match their call sites.
