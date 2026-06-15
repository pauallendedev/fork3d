# Functional Shell — Phase 2 (Editor Tabs + Read-Only File Viewer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the center column into a tabbed editor area where the live Office is the pinned first tab, and clicking a file in the Explorer opens it in a read-only, syntax-highlighted tab.

**Architecture:** A new `EditorArea` renders an `EditorTabs` strip + the active tab's body (office → OfficeScene+CommandPalette; file → FileView). The store tracks `openTabs`/`activeTabId`. A guarded `readFile` IPC streams file content from the main process (scoped to the open project root, with binary/size guards). `FileView` highlights with **Shiki**, using the **JavaScript regex engine** (no WASM) + lazy per-language chunks. Vite `base: './'` makes the packaged `file://` build resolve those chunks.

**Tech Stack:** React 19 + TS strict + zustand (existing). Added: `shiki@^4.2.0`. Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-forkcode-functional-shell-design.md` (Phase P2). Phase 2 only.

**Environment note for implementers:** Headless — NEVER run `npm run dev`. Verify with `npm run build`, `npx vitest run`, `npm run lint`. GUI/highlighting checks are PENDING MANUAL VERIFICATION. Lint has 6 pre-existing errors in `src/scene/iso.tsx` — ignore those, add none. Shiki research (verified, current as of 2026-06): use `createHighlighterCore` from `shiki/core` + `createJavaScriptRegexEngine` from `shiki/engine/javascript`; lazy-load langs via an EXPLICIT loader map (never a template-literal `import(\`@shikijs/langs/${x}\`)`, which over-bundles/breaks under `file://`); `dangerouslySetInnerHTML` from `codeToHtml` is safe (Shiki escapes token text, input is a local file).

---

## File structure (Phase 2)

- Modify: `package.json` — add `shiki` dependency.
- Modify: `vite.config.ts` — add `base: './'` (fixes `file://` asset resolution for the packaged app + Shiki chunks).
- Modify: `src/state/types.ts` — add `EditorTab`, `FilePayload`.
- Modify: `src/state/store.ts` — add `openTabs`/`activeTabId` + `openFileTab`/`closeTab`/`setActiveTab`.
- Create: `src/state/tabs.test.ts` — store tab-logic tests.
- Create: `electron/file-read.ts` — `langForFile` + `readFileGuarded` (pure, tested).
- Create: `electron/file-read.test.ts`.
- Modify: `electron/main.ts` — `fs:readFile` IPC handler.
- Modify: `electron/preload.ts` — expose `readFile`.
- Modify: `src/electron.d.ts` — add `readFile` to `window.forkcode`.
- Create: `src/lib/highlighter.ts` — Shiki singleton (JS engine, lazy langs).
- Create: `src/components/FileView.tsx` + `.css` — read-only highlighted file view.
- Create: `src/components/EditorTabs.tsx` + `.css` — the tab strip.
- Create: `src/components/EditorArea.tsx` — tabs + active body.
- Modify: `src/App.tsx` — mount `<EditorArea/>` in the center (move OfficeScene+CommandPalette into it).
- Modify: `src/components/Explorer.tsx` — file-row click opens a file tab.

---

### Task 1: Add Shiki + Vite `base: './'`

**Files:**
- Modify: `package.json`, `vite.config.ts`

- [ ] **Step 1: Install Shiki**

Run: `npm i shiki@^4.2.0`
Expected: `shiki` appears in `dependencies`.

- [ ] **Step 2: Set Vite base for `file://` packaging**

In `vite.config.ts`, add `base: './'` as the first key inside `defineConfig({ ... })` (keep the existing `plugins` array untouched):
```ts
export default defineConfig({
  base: './',
  plugins: [
    // ...existing react() + electron({...}) unchanged...
  ],
})
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — clean; confirm `dist/index.html` now references assets with a RELATIVE path (`./assets/...` not `/assets/...`): `grep -o 'src="[^"]*"' dist/index.html` should show `./assets/`.
Run: `npx vitest run` (all pass), `npm run lint` (no new errors).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "build: add shiki; set Vite base './' for packaged file:// asset resolution"
```

---

### Task 2: File-read guard module (pure, TDD)

**Files:**
- Create: `electron/file-read.ts`, `electron/file-read.test.ts`
- Modify: `src/state/types.ts` (add `FilePayload`)

- [ ] **Step 1: Add the `FilePayload` renderer type**

In `src/state/types.ts`, append:
```ts
export interface FilePayload {
  content: string
  lang: string
  truncated: boolean
  binary: boolean
}
```

- [ ] **Step 2: Write the failing test**

Create `electron/file-read.test.ts`:
```ts
import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { langForFile, readFileGuarded } from './file-read'

let root: string
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forkcode-read-'))
  writeFileSync(join(root, 'a.ts'), 'const x: number = 1\n')
  writeFileSync(join(root, 'big.txt'), 'x'.repeat(1_200_000))
  writeFileSync(join(root, 'bin.dat'), Buffer.from([1, 2, 0, 3, 4]))
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('langForFile maps extensions and falls back to text', () => {
  expect(langForFile('a.ts')).toBe('typescript')
  expect(langForFile('x.unknownext')).toBe('text')
  expect(langForFile('Makefile')).toBe('text')
})

test('reads a normal text file with detected lang', () => {
  const p = readFileGuarded(join(root, 'a.ts'), root)
  expect(p.binary).toBe(false)
  expect(p.truncated).toBe(false)
  expect(p.lang).toBe('typescript')
  expect(p.content).toContain('const x')
})

test('flags oversize files as truncated (no content)', () => {
  const p = readFileGuarded(join(root, 'big.txt'), root)
  expect(p.truncated).toBe(true)
  expect(p.content).toBe('')
})

test('flags binary files (no content)', () => {
  const p = readFileGuarded(join(root, 'bin.dat'), root)
  expect(p.binary).toBe(true)
  expect(p.content).toBe('')
})

test('rejects paths outside the root', () => {
  const p = readFileGuarded(join(root, '..', 'etc-passwd-ish'), root)
  expect(p.content).toBe('')
  expect(p.binary).toBe(false)
  expect(p.truncated).toBe(false)
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run electron/file-read.test.ts`
Expected: FAIL — `Cannot find module './file-read'`.

- [ ] **Step 4: Implement the module**

Create `electron/file-read.ts`:
```ts
import { readFileSync, statSync, realpathSync } from 'node:fs'
import { sep } from 'node:path'
import type { FilePayload } from '../src/state/types'

const MAX_BYTES = 1_000_000

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  json: 'json', jsonc: 'jsonc', css: 'css', scss: 'scss', less: 'less', html: 'html', htm: 'html',
  md: 'markdown', py: 'python', rs: 'rust', go: 'go', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash', sql: 'sql', toml: 'toml',
}

export function langForFile(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return 'text'
  const ext = name.slice(dot + 1).toLowerCase()
  return EXT_TO_LANG[ext] ?? 'text'
}

function canonical(p: string): string {
  try {
    return realpathSync(p)
  } catch {
    return p
  }
}

/** Read a file only if it resolves inside `root`; guard size + binary. Never throws. */
export function readFileGuarded(absPath: string, root: string): FilePayload {
  const empty: FilePayload = { content: '', lang: langForFile(absPath), truncated: false, binary: false }
  const realRoot = canonical(root)
  const real = canonical(absPath)
  if (realRoot && real !== realRoot && !real.startsWith(realRoot + sep)) return empty // outside root

  let size = 0
  try {
    const st = statSync(real)
    if (!st.isFile()) return empty
    size = st.size
  } catch {
    return empty
  }
  if (size > MAX_BYTES) return { ...empty, truncated: true }

  let buf: Buffer
  try {
    buf = readFileSync(real)
  } catch {
    return empty
  }
  // binary detection: NUL byte in the first 8 KB
  const scan = buf.subarray(0, 8192)
  if (scan.includes(0)) return { ...empty, binary: true }

  return { content: buf.toString('utf8'), lang: langForFile(absPath), truncated: false, binary: false }
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run electron/file-read.test.ts`
Expected: PASS (5 passed).

- [ ] **Step 6: Verify suite + electron type-check + commit**

Run: `npx vitest run` (all pass), `npm run build` (clean — the `tsc -p tsconfig.electron.json` step follows the `../src/state/types` type-only import; it's erased, no DOM dep). `npm run lint` (no new errors).
```bash
git add electron/file-read.ts electron/file-read.test.ts src/state/types.ts
git commit -m "feat: guarded file reader (lang detection, size/binary/path-scope guards)"
```

---

### Task 3: `readFile` IPC + preload + typing

**Files:**
- Modify: `electron/main.ts`, `electron/preload.ts`, `src/electron.d.ts`

- [ ] **Step 1: Add the IPC handler in main**

In `electron/main.ts`, add the import near the others:
```ts
import { readFileGuarded } from './file-read'
```
and add this handler next to the existing `fs:readTree` handler (it uses the module-level `projectRoot` that `openProject` already maintains):
```ts
ipcMain.handle('fs:readFile', async (_e, p: string) => {
  if (!p || !projectRoot) return { content: '', lang: 'text', truncated: false, binary: false }
  return readFileGuarded(p, projectRoot)
})
```

- [ ] **Step 2: Expose it from preload**

In `electron/preload.ts`, add to the `api` object (alongside `readTree`):
```ts
  readFile: (path: string): Promise<import('../src/state/types').FilePayload> =>
    ipcRenderer.invoke('fs:readFile', path),
```
(Use the inline `import('...')` type so preload stays self-contained; or add a top-of-file `import type { FilePayload } from '../src/state/types'` and use `Promise<FilePayload>` — either is fine.)

- [ ] **Step 3: Declare it on `window.forkcode`**

In `src/electron.d.ts`, add to the `forkcode` interface (alongside `readTree`):
```ts
      readFile(path: string): Promise<import('./state/types').FilePayload>
```

- [ ] **Step 4: Verify build (headless; GUI round-trip pending)**

Run: `npm run build` (clean — main + preload + electron type-check). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 5: Commit**

```bash
git add electron/main.ts electron/preload.ts src/electron.d.ts
git commit -m "feat: readFile IPC scoped to the open project root"
```

---

### Task 4: Store — editor tabs (TDD)

**Files:**
- Modify: `src/state/types.ts`, `src/state/store.ts`
- Test: `src/state/tabs.test.ts`

- [ ] **Step 1: Add the `EditorTab` type**

In `src/state/types.ts`, append:
```ts
export interface EditorTab {
  id: string // 'office' for the pinned office tab; otherwise the file's absolute path
  kind: 'office' | 'file'
  title: string
  path?: string
}
```

- [ ] **Step 2: Write the failing test**

Create `src/state/tabs.test.ts`:
```ts
import { beforeEach, expect, test } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  // reset tabs before each test
  useStore.setState({ openTabs: [{ id: 'office', kind: 'office', title: 'Office' }], activeTabId: 'office' })
})

test('office tab exists by default and is active', () => {
  const s = useStore.getState()
  expect(s.openTabs).toEqual([{ id: 'office', kind: 'office', title: 'Office' }])
  expect(s.activeTabId).toBe('office')
})

test('openFileTab adds a file tab and activates it; re-opening just activates', () => {
  useStore.getState().openFileTab('/p/a.ts', 'a.ts')
  let s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts'])
  expect(s.activeTabId).toBe('/p/a.ts')

  useStore.getState().setActiveTab('office')
  useStore.getState().openFileTab('/p/a.ts', 'a.ts') // already open
  s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts']) // no duplicate
  expect(s.activeTabId).toBe('/p/a.ts')
})

test('closeTab removes a file tab; closing the active one activates a neighbor; office never closes', () => {
  useStore.getState().openFileTab('/p/a.ts', 'a.ts')
  useStore.getState().openFileTab('/p/b.ts', 'b.ts')
  useStore.getState().closeTab('/p/b.ts') // was active
  let s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts'])
  expect(s.activeTabId).toBe('/p/a.ts')

  useStore.getState().closeTab('office') // pinned — no-op
  s = useStore.getState()
  expect(s.openTabs.some((t) => t.id === 'office')).toBe(true)
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/state/tabs.test.ts`
Expected: FAIL — `openFileTab is not a function` / `openTabs` undefined.

- [ ] **Step 4: Add tabs state + actions to the store**

In `src/state/store.ts`:
1. Add `EditorTab` to the type import from `./types`.
2. In the `ForkcodeStore` interface add:
```ts
  openTabs: EditorTab[]
  activeTabId: string
  openFileTab: (path: string, title: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
```
3. In the `create(...)` initial state (near `activeView`):
```ts
  openTabs: [{ id: 'office', kind: 'office', title: 'Office' }],
  activeTabId: 'office',
```
4. In the actions (near `setActiveView`):
```ts
  openFileTab: (path, title) =>
    set((s) => {
      const exists = s.openTabs.some((t) => t.id === path)
      const openTabs = exists ? s.openTabs : [...s.openTabs, { id: path, kind: 'file' as const, title, path }]
      return { openTabs, activeTabId: path }
    }),
  closeTab: (id) =>
    set((s) => {
      if (id === 'office') return s
      const idx = s.openTabs.findIndex((t) => t.id === id)
      if (idx < 0) return s
      const openTabs = s.openTabs.filter((t) => t.id !== id)
      const activeTabId = s.activeTabId === id ? (openTabs[idx - 1] ?? openTabs[0]).id : s.activeTabId
      return { openTabs, activeTabId }
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/state/tabs.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 6: Verify suite + build + commit**

Run: `npx vitest run` (all pass), `npm run build` (clean), `npm run lint` (no new errors).
```bash
git add src/state/types.ts src/state/store.ts src/state/tabs.test.ts
git commit -m "feat: editor tab state (office pinned + file tabs)"
```

---

### Task 5: Shiki highlighter singleton

**Files:**
- Create: `src/lib/highlighter.ts`

- [ ] **Step 1: Implement the singleton (JS engine, lazy langs)**

Create `src/lib/highlighter.ts`:
```ts
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const THEME = 'github-light'

// Explicit per-language loaders — NOT a template-literal dynamic import (that over-bundles
// and can break under file://). Each becomes its own lazy chunk.
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('@shikijs/langs/typescript'),
  tsx: () => import('@shikijs/langs/tsx'),
  javascript: () => import('@shikijs/langs/javascript'),
  jsx: () => import('@shikijs/langs/jsx'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  less: () => import('@shikijs/langs/less'),
  html: () => import('@shikijs/langs/html'),
  markdown: () => import('@shikijs/langs/markdown'),
  python: () => import('@shikijs/langs/python'),
  rust: () => import('@shikijs/langs/rust'),
  go: () => import('@shikijs/langs/go'),
  yaml: () => import('@shikijs/langs/yaml'),
  bash: () => import('@shikijs/langs/bash'),
  sql: () => import('@shikijs/langs/sql'),
  toml: () => import('@shikijs/langs/toml'),
}

let hlPromise: Promise<HighlighterCore> | null = null
function getHighlighter(): Promise<HighlighterCore> {
  if (!hlPromise) {
    hlPromise = createHighlighterCore({
      themes: [import('@shikijs/themes/github-light')],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return hlPromise
}

/** Highlight code to HTML. Unknown/unsupported langs render as plain text (no grammar load). */
export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter()
  let useLang = 'text'
  const loader = LANG_LOADERS[lang]
  if (loader) {
    if (!hl.getLoadedLanguages().includes(lang)) {
      // loadLanguage accepts the dynamic-import promise (Shiki resolves the module/default)
      await hl.loadLanguage(loader() as never)
    }
    useLang = lang
  }
  return hl.codeToHtml(code, { lang: useLang, theme: THEME })
}
```
(If `tsc` rejects `loader() as never` for `loadLanguage`, type the loader values as `() => Promise<{ default: unknown }>` and cast to the param type Shiki exports — the runtime behavior is to pass the import promise.)

- [ ] **Step 2: Verify build (lazy chunks emitted)**

Run: `npm run build` — clean; in the Vite output you should see additional small chunks for the Shiki theme/langs (code-split). `npm run lint` (no new errors). `npx vitest run` (all pass — this module isn't imported by any test yet; that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/lib/highlighter.ts
git commit -m "feat: Shiki highlighter singleton (JS engine, lazy languages, no WASM)"
```

---

### Task 6: FileView component

**Files:**
- Create: `src/components/FileView.tsx`, `src/components/FileView.css`

- [ ] **Step 1: Implement FileView**

Create `src/components/FileView.tsx`:
```tsx
import { useEffect, useState } from 'react'
import type { FilePayload } from '../state/types'
import { highlight } from '../lib/highlighter'
import './FileView.css'

export function FileView({ path }: { path: string }) {
  const [payload, setPayload] = useState<FilePayload | null>(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setHtml('')
    setPayload(null)
    const fc = window.forkcode
    if (!fc) {
      setLoading(false)
      return
    }
    fc.readFile(path).then(async (p) => {
      if (cancelled) return
      setPayload(p)
      if (!p.binary && !p.truncated && p.content) {
        try {
          const out = await highlight(p.content, p.lang)
          if (!cancelled) setHtml(out)
        } catch {
          /* fall back to plain text below */
        }
      }
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (loading) return <div className="fv-msg">Loading…</div>
  if (!payload) return <div className="fv-msg">Could not read file.</div>
  if (payload.binary) return <div className="fv-msg">Binary file — preview not available.</div>
  if (payload.truncated) return <div className="fv-msg">File too large to preview.</div>
  if (html) return <div className="fv-code" dangerouslySetInnerHTML={{ __html: html }} />
  return <pre className="fv-plain">{payload.content}</pre>
}
```

- [ ] **Step 2: Add styles**

Create `src/components/FileView.css`:
```css
.fv-code,
.fv-plain {
  height: 100%;
  overflow: auto;
  margin: 0;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  background: var(--bg-panel);
}
/* Shiki emits a <pre class="shiki"> — let it fill and scroll */
.fv-code :global(pre.shiki) {
  margin: 0;
  background: transparent !important;
}
.fv-plain {
  white-space: pre;
  color: var(--text-1);
}
.fv-msg {
  padding: 16px 14px;
  font-size: 12px;
  color: var(--text-2);
}
```
(Plain CSS files don't support `:global` — if the build complains, drop the `:global(...)` rule and instead target `.fv-code pre` directly: `.fv-code pre { margin: 0; background: transparent !important; }`.)

- [ ] **Step 3: Verify build**

Run: `npm run build` (clean). `npm run lint` (no new errors — note `dangerouslySetInnerHTML` is fine here; if an eslint rule flags it, it's acceptable and may be disabled inline with a comment explaining Shiki escapes token text). `npx vitest run` (all pass).

- [ ] **Step 4: Commit**

```bash
git add src/components/FileView.tsx src/components/FileView.css
git commit -m "feat: read-only FileView with Shiki highlighting"
```

---

### Task 7: EditorTabs + EditorArea; mount in App

**Files:**
- Create: `src/components/EditorTabs.tsx`, `src/components/EditorTabs.css`, `src/components/EditorArea.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the tab strip**

Create `src/components/EditorTabs.tsx`:
```tsx
import { useStore } from '../state/store'
import './EditorTabs.css'

export function EditorTabs() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const closeTab = useStore((s) => s.closeTab)

  return (
    <div className="et-bar" role="tablist">
      {openTabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          aria-selected={activeTabId === t.id}
          className={activeTabId === t.id ? 'et-tab et-tab--active' : 'et-tab'}
          onClick={() => setActiveTab(t.id)}
        >
          <span className="et-title">{t.title}</span>
          {t.kind === 'file' && (
            <button
              type="button"
              className="et-close"
              aria-label={`Close ${t.title}`}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(t.id)
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

Create `src/components/EditorTabs.css`:
```css
.et-bar {
  display: flex;
  align-items: stretch;
  height: 34px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  overflow-x: auto;
  flex: 0 0 auto;
}
.et-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text-2);
  border-right: 1px solid var(--border);
  cursor: pointer;
  white-space: nowrap;
}
.et-tab:hover {
  background: var(--bg-hover);
}
.et-tab--active {
  background: var(--bg-panel);
  color: var(--text-1);
  box-shadow: inset 0 -2px 0 var(--accent);
}
.et-close {
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.et-close:hover {
  background: var(--bg-hover);
  color: var(--text-1);
}
```

- [ ] **Step 2: Create the EditorArea**

Create `src/components/EditorArea.tsx`:
```tsx
import { useStore } from '../state/store'
import { OfficeScene } from '../scene/OfficeScene'
import { CommandPalette } from './CommandPalette'
import { EditorTabs } from './EditorTabs'
import { FileView } from './FileView'

export function EditorArea() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const active = openTabs.find((t) => t.id === activeTabId) ?? openTabs[0]

  return (
    <div className="ea-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <EditorTabs />
      <div className="ea-body" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {active.kind === 'office' ? (
          <>
            <OfficeScene />
            <CommandPalette />
          </>
        ) : (
          <FileView path={active.path!} />
        )}
      </div>
    </div>
  )
}
```
(Inline styles keep this task self-contained; the office tab body keeps OfficeScene + the floating CommandPalette exactly as before. If you prefer a CSS file, create `EditorArea.css` with `.ea-root`/`.ea-body` equivalents — optional.)

- [ ] **Step 3: Mount EditorArea in App (replace the direct OfficeScene/CommandPalette)**

In `src/App.tsx`:
1. Replace the imports of `OfficeScene` and `CommandPalette` with `EditorArea`:
   - remove `import { CommandPalette } from './components/CommandPalette'`
   - remove `import { OfficeScene } from './scene/OfficeScene'`
   - add `import { EditorArea } from './components/EditorArea'`
2. Replace the scene-column body:
```tsx
<section className="app-card app-scene-col">
  <EditorArea />
</section>
```
(was `<OfficeScene /><CommandPalette />`).

- [ ] **Step 4: Verify build**

Run: `npm run build` (clean — no unused `OfficeScene`/`CommandPalette` imports in App). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/EditorTabs.tsx src/components/EditorTabs.css src/components/EditorArea.tsx src/App.tsx
git commit -m "feat: tabbed editor area (Office pinned tab + file tabs)"
```

---

### Task 8: Open files from the Explorer

**Files:**
- Modify: `src/components/Explorer.tsx`

- [ ] **Step 1: Make file rows open a tab**

In `src/components/Explorer.tsx`, find the `FileRow` component. It currently selects an agent for `icon === 'agent'` files. Change it so a file row with a real `path` opens a file tab, while keeping the legacy agent-select behavior for the static demo tree. Update `FileRow`:
```tsx
function FileRow({ node, depth }: { node: FileNode; depth: number }) {
  const selected = useStore((s) => s.selected)
  const selectAgent = useStore((s) => s.selectAgent)
  const openFileTab = useStore((s) => s.openFileTab)
  const agentColor = node.icon === 'agent' ? node.color : undefined
  const isSelected = agentColor !== undefined && agentColor === selected
  function onClick() {
    if (node.path) {
      openFileTab(node.path, node.name)
    } else if (agentColor) {
      selectAgent(agentColor)
    }
  }
  return (
    <button
      type="button"
      className={isSelected ? 'ex-row ex-row-selected' : 'ex-row'}
      style={{ paddingLeft: pad(depth) }}
      onClick={onClick}
    >
      <FileIcon node={node} />
      <span className="ex-name">{node.name}</span>
      <Badge badge={node.badge} />
    </button>
  )
}
```
(Real tree nodes always have `path` → open a tab; the static fallback tree's agent files have no `path` → keep selecting the agent. `useStore`, `pad`, `FileIcon`, `Badge` are already in scope in this file.)

- [ ] **Step 2: Verify build**

Run: `npm run build` (clean). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 3: Manual GUI verification (PENDING — record, do not run the GUI headless)**

For the user (`env -u ELECTRON_RUN_AS_NODE npm run dev`, or `npm run dev` in a normal terminal):
- Open a folder; the center shows an "Office" tab. Click a source file in the Explorer → a new tab opens with the file's **syntax-highlighted, read-only** content; the Office tab still shows the live office and is one click away.
- Open several files → multiple tabs; close a file tab with × → it closes and a neighbor activates; the Office tab has no × and never closes.
- A binary file shows "Binary file — preview not available."; a >1 MB file shows "File too large to preview."
- (Packaging) `npm run dist` → in the installed `.dmg`, the renderer is NOT blank (the `base: './'` fix) and highlighting works (the JS engine, no WASM).

- [ ] **Step 4: Commit**

```bash
git add src/components/Explorer.tsx
git commit -m "feat: open files from the Explorer into read-only tabs"
```

---

## Self-review notes

- **Spec coverage (P2):** editor tabs with Office pinned (Tasks 4,7), read-only file viewing with Shiki (Tasks 5,6,7), open-from-Explorer (Task 8), `readFile` IPC scoped to root + binary/size guards (Tasks 2,3), Vite `base` fix for packaged `file://` (Task 1). Search/SCM = P4; terminal = P3; office polish = P5 — out of this plan.
- **Build-green ordering:** deps/types first; the store/IPC/highlighter/FileView are added before EditorArea mounts them; App swaps to EditorArea only in Task 7.
- **Type consistency:** `FilePayload` (src/state/types.ts) is the single source used by `file-read.ts`, preload, electron.d.ts, and FileView; `EditorTab` is used identically in store + EditorTabs + EditorArea; `openFileTab(path, title)` / `closeTab(id)` / `setActiveTab(id)` signatures match all call sites.
- **Key packaging fix:** `base: './'` (Task 1) resolves the existing v1 risk that the packaged `.dmg` renderer loads assets from absolute `/assets/...` under `file://` (blank window) — verify via `npm run dist` in Task 8.
