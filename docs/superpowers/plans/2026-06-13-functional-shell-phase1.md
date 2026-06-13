# Functional Shell — Phase 1 (Sidebar + Explorer Open-Folder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ActivityBar switch the sidebar between real panels, and give the Explorer a VS Code-style "Open Folder" empty state (removing the titlebar folder button and the fake demo tree).

**Architecture:** Add an `activeView` to the zustand store; a new `Sidebar` component renders the panel for the active view (Explorer + placeholder Search/SCM/Extensions panels). The ActivityBar drives `activeView`. The Explorer shows an "Open Folder" button when no real folder is open. No new dependencies.

**Tech Stack:** React 19 + TS strict + zustand (existing). Plain CSS. Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-forkcode-functional-shell-design.md` (Phase P1). This plan is Phase 1 only; Phases 2–5 (editor tabs/file viewer, terminal, search/SCM, office polish) are separate plans.

**Environment note for implementers:** Headless — NEVER run `npm run dev` (it blocks/launches a GUI). Verify with `npm run build`, `npx vitest run`, `npm run lint`. GUI checks are PENDING MANUAL VERIFICATION. To launch from an agent shell for the user, it's `env -u ELECTRON_RUN_AS_NODE npm run dev` (the sandbox sets `ELECTRON_RUN_AS_NODE=1`). Lint has 6 pre-existing errors in `src/scene/iso.tsx` — ignore those, introduce no new ones.

---

## File structure (Phase 1)

- Modify: `src/state/types.ts` — add `ActiveView` union.
- Modify: `src/state/store.ts` — add `activeView` + `setActiveView`.
- Create: `src/state/store.activeView.test.ts` — store action test.
- Modify: `src/components/Explorer.tsx` — optional `isReal`/`onOpenFolder` props + empty state.
- Modify: `src/components/Explorer.css` — empty-state styles.
- Modify: `src/components/ActivityBar.tsx` — wire items to `setActiveView`.
- Create: `src/components/Sidebar.tsx` — renders the panel for `activeView`.
- Create: `src/components/Sidebar.css` — placeholder-panel styles.
- Create: `src/components/SearchPanel.tsx` — placeholder (real in P4).
- Create: `src/components/SourceControlPanel.tsx` — placeholder (real in P4).
- Create: `src/components/ExtensionsPanel.tsx` — honest placeholder.
- Modify: `src/App.tsx` — mount `<Sidebar/>`; pass tree + openFolder; drop TitleBar folder prop.
- Modify: `src/components/TitleBar.tsx` — remove the folder button + `onOpenFolder` prop.

---

### Task 1: Store — `activeView` state (TDD)

**Files:**
- Modify: `src/state/types.ts`
- Modify: `src/state/store.ts`
- Test: `src/state/store.activeView.test.ts`

- [ ] **Step 1: Add the `ActiveView` type**

In `src/state/types.ts`, append at the end:
```ts
export type ActiveView = 'explorer' | 'search' | 'scm' | 'spatial' | 'extensions'
```

- [ ] **Step 2: Write the failing test**

Create `src/state/store.activeView.test.ts`:
```ts
import { expect, test } from 'vitest'
import { useStore } from './store'

test('activeView defaults to explorer and setActiveView changes it', () => {
  expect(useStore.getState().activeView).toBe('explorer')
  useStore.getState().setActiveView('search')
  expect(useStore.getState().activeView).toBe('search')
  useStore.getState().setActiveView('explorer') // reset for other tests
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/state/store.activeView.test.ts`
Expected: FAIL — `activeView` is undefined / `setActiveView is not a function`.

- [ ] **Step 4: Add the state + action to the store**

In `src/state/store.ts`:
1. Add `ActiveView` to the type import from `./types` (it already imports several types from there) — e.g. change the existing import to include `ActiveView`.
2. In the `ForkcodeStore` interface, add:
```ts
  activeView: ActiveView
  setActiveView: (v: ActiveView) => void
```
3. In the `create(...)` initial state object, add (near `bottomTab`):
```ts
  activeView: 'explorer',
```
4. In the actions, add (near `setBottomTab`):
```ts
  setActiveView: (v) => set({ activeView: v }),
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/state/store.activeView.test.ts`
Expected: PASS (1 passed).

- [ ] **Step 6: Verify the suite + build**

Run: `npx vitest run` (all pass) and `npm run build` (clean). `npm run lint` (no new errors).

- [ ] **Step 7: Commit**

```bash
git add src/state/types.ts src/state/store.ts src/state/store.activeView.test.ts
git commit -m "feat: add activeView state for sidebar view switching"
```

---

### Task 2: Explorer empty state ("Open Folder")

**Files:**
- Modify: `src/components/Explorer.tsx`
- Modify: `src/components/Explorer.css`

- [ ] **Step 1: Add optional props + empty-state branch**

In `src/components/Explorer.tsx`, change the `Explorer` component signature and add an early empty-state return BEFORE the existing tree markup. Replace the current `export function Explorer({ rootName, nodes }: { rootName: string; nodes: FileNode[] }) {` line and the start of its body with:
```tsx
export function Explorer({
  rootName,
  nodes,
  isReal = true,
  onOpenFolder,
}: {
  rootName: string
  nodes: FileNode[]
  isReal?: boolean
  onOpenFolder?: () => void
}) {
  const [rootOpen, setRootOpen] = useState(true)

  if (!isReal) {
    return (
      <div className="ex-root">
        <div className="ex-header">
          <span className="ex-title">EXPLORER</span>
          <button type="button" className="ex-more" aria-label="More actions">
            <MoreIcon />
          </button>
        </div>
        <div className="ex-empty">
          <p className="ex-empty-msg">You have not opened a folder.</p>
          {onOpenFolder && (
            <button type="button" className="ex-open-btn" onClick={onOpenFolder}>
              Open Folder
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
```
(The rest of the existing returned JSX — the `ex-root` with the tree and the pinned OUTLINE/TIMELINE — stays exactly as it is. You are only adding the destructured props, the `isReal`/`onOpenFolder` defaults, and the `if (!isReal)` early return above the existing `return (`. Do not duplicate the `const [rootOpen, setRootOpen] = useState(true)` line — it now lives at the top of the function before the `if`.)

- [ ] **Step 2: Add empty-state styles**

Append to `src/components/Explorer.css`:
```css
.ex-empty {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}
.ex-empty-msg {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
}
.ex-open-btn {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  cursor: pointer;
}
.ex-open-btn:hover {
  filter: brightness(1.06);
}
```

- [ ] **Step 3: Verify build (App still compiles — it doesn't pass the new props yet, defaults apply)**

Run: `npm run build` (clean — `isReal` defaults to `true`, so the existing `<Explorer rootName nodes>` call still shows the tree). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 4: Commit**

```bash
git add src/components/Explorer.tsx src/components/Explorer.css
git commit -m "feat: Explorer 'Open Folder' empty state when no folder is open"
```

---

### Task 3: ActivityBar drives `activeView`

**Files:**
- Modify: `src/components/ActivityBar.tsx`

- [ ] **Step 1: Wire items to the store**

In `src/components/ActivityBar.tsx`:
1. Add imports at the top:
```tsx
import { useStore } from '../state/store'
import type { ActiveView } from '../state/types'
```
2. Change the `AbItem` interface and `ITEMS` to carry a `view`:
```tsx
interface AbItem {
  label: string
  view: ActiveView
  icon: ReactNode
}

const ITEMS: AbItem[] = [
  { label: 'Explorer', view: 'explorer', icon: <FilesIcon /> },
  { label: 'Search', view: 'search', icon: <SearchIcon /> },
  { label: 'Source Control', view: 'scm', icon: <BranchIcon /> },
  { label: 'Spatial CAD', view: 'spatial', icon: <CubeIcon /> },
  { label: 'Extensions', view: 'extensions', icon: <SquaresIcon /> },
]
```
3. Replace the `ActivityBar` component body so the active item and click come from the store:
```tsx
export function ActivityBar() {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)
  return (
    <nav className="ab-root" aria-label="Activity Bar">
      {ITEMS.map((item) => {
        const active = activeView === item.view
        return (
          <button
            key={item.label}
            type="button"
            className={active ? 'ab-item ab-item--active' : 'ab-item'}
            aria-pressed={active}
            onClick={() => setActiveView(item.view)}
          >
            <span className="ab-tile">{item.icon}</span>
            <span className="ab-label">{item.label}</span>
          </button>
        )
      })}
      <div className="ab-bottom">
        <div className="ab-avatar" aria-hidden="true">
          <RobotFace />
        </div>
        <span className="ab-online">Online</span>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (clean). `npm run lint` (no new errors — the old `active?: boolean` field on `AbItem` is gone; ensure nothing references it). `npx vitest run` (all pass).

- [ ] **Step 3: Commit**

```bash
git add src/components/ActivityBar.tsx
git commit -m "feat: ActivityBar switches the active sidebar view"
```

---

### Task 4: Sidebar component + placeholder panels

**Files:**
- Create: `src/components/SearchPanel.tsx`
- Create: `src/components/SourceControlPanel.tsx`
- Create: `src/components/ExtensionsPanel.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Sidebar.css`

- [ ] **Step 1: Create the placeholder panels**

Create `src/components/SearchPanel.tsx`:
```tsx
import './Sidebar.css'

export function SearchPanel() {
  return (
    <div className="sb-placeholder">
      <span className="sb-ph-title">SEARCH</span>
      <p className="sb-ph-msg">Full-text search across your project — coming soon.</p>
    </div>
  )
}
```

Create `src/components/SourceControlPanel.tsx`:
```tsx
import './Sidebar.css'

export function SourceControlPanel() {
  return (
    <div className="sb-placeholder">
      <span className="sb-ph-title">SOURCE CONTROL</span>
      <p className="sb-ph-msg">Git status for the open folder — coming soon.</p>
    </div>
  )
}
```

Create `src/components/ExtensionsPanel.tsx`:
```tsx
import './Sidebar.css'

export function ExtensionsPanel() {
  return (
    <div className="sb-placeholder">
      <span className="sb-ph-title">EXTENSIONS</span>
      <p className="sb-ph-msg">
        Managed by ForkCode. Agent roles are configured as custom agents in
        <code> .claude/agents/</code>.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create the Sidebar**

Create `src/components/Sidebar.tsx`:
```tsx
import { useStore } from '../state/store'
import type { ProjectTree } from '../hooks/useProjectTree'
import { Explorer } from './Explorer'
import { SearchPanel } from './SearchPanel'
import { SourceControlPanel } from './SourceControlPanel'
import { ExtensionsPanel } from './ExtensionsPanel'
import './Sidebar.css'

export function Sidebar({ tree, onOpenFolder }: { tree: ProjectTree; onOpenFolder?: () => void }) {
  const activeView = useStore((s) => s.activeView)

  switch (activeView) {
    case 'explorer':
      return <Explorer rootName={tree.rootName} nodes={tree.nodes} isReal={tree.isReal} onOpenFolder={onOpenFolder} />
    case 'search':
      return <SearchPanel />
    case 'scm':
      return <SourceControlPanel />
    case 'extensions':
      return <ExtensionsPanel />
    case 'spatial':
      return (
        <div className="sb-placeholder">
          <span className="sb-ph-title">SPATIAL CAD</span>
          <p className="sb-ph-msg">The office is the editor. Scene controls — coming soon.</p>
        </div>
      )
  }
}
```

- [ ] **Step 3: Create the Sidebar styles**

Create `src/components/Sidebar.css`:
```css
.sb-placeholder {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sb-ph-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
}
.sb-ph-msg {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
}
.sb-ph-msg code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-1);
}
```

- [ ] **Step 4: Verify build (Sidebar not mounted yet)**

Run: `npm run build` (clean — `ProjectTree` is exported from `src/hooks/useProjectTree.ts`; confirm by reading that file if the import errors). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Sidebar.css src/components/SearchPanel.tsx src/components/SourceControlPanel.tsx src/components/ExtensionsPanel.tsx
git commit -m "feat: Sidebar renders the panel for the active view (+ placeholder panels)"
```

---

### Task 5: Mount the Sidebar; remove the titlebar folder button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TitleBar.tsx`

- [ ] **Step 1: Mount `<Sidebar/>` in App and drop the TitleBar folder prop**

In `src/App.tsx`:
1. Change the Explorer import to the Sidebar:
```tsx
import { Sidebar } from './components/Sidebar'
```
(remove `import { Explorer } from './components/Explorer'`)
2. Replace the sidebar `<aside>` body — change `<Explorer rootName={tree.rootName} nodes={tree.nodes} />` to:
```tsx
<Sidebar tree={tree} onOpenFolder={window.forkcode ? openFolder : undefined} />
```
3. Remove the `onOpenFolder={window.forkcode ? openFolder : undefined}` line from the `<TitleBar ... />` props (keep `connected`, `canConnect`, `onConnect`, `demo`, `onToggleDemo`).

- [ ] **Step 2: Remove the folder button from the TitleBar**

In `src/components/TitleBar.tsx`:
1. Remove `onOpenFolder?: () => void` from the `TitleBarProps` interface.
2. Remove `onOpenFolder` from the destructured params in `export function TitleBar({ ... })`.
3. Delete the folder button block:
```tsx
{onOpenFolder && (
  <button className="tb-btn" type="button" aria-label="Open folder" onClick={onOpenFolder}>
    <FolderIcon />
  </button>
)}
```
4. Delete the now-unused `FolderIcon` function definition (lines defining `function FolderIcon()`), or `tsc`/lint will flag it unused.

- [ ] **Step 3: Verify build + full type-check**

Run: `npm run build` (clean — no unused `Explorer`/`FolderIcon`/`onOpenFolder`). `npm run lint` (no new errors). `npx vitest run` (all pass).

- [ ] **Step 4: Manual GUI verification (PENDING — record, do not run the GUI headless)**

These are for the user to verify with `env -u ELECTRON_RUN_AS_NODE npm run dev` (or plain `npm run dev` in a normal terminal):
- The ActivityBar icons switch the sidebar: Explorer → tree (or "Open Folder" when none), Search/Source Control/Spatial CAD/Extensions → their placeholder panels; the clicked icon is highlighted.
- With no folder open, the Explorer shows "You have not opened a folder." + an **Open Folder** button that opens the native picker and loads the real tree.
- The titlebar no longer has a folder icon; Connect + Demo buttons remain.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/TitleBar.tsx
git commit -m "feat: mount Sidebar; move Open Folder into the Explorer panel"
```

---

## Self-review notes

- **Spec coverage (P1):** ActivityBar panel switching (Tasks 1,3,4), Explorer "Open Folder" empty state + folder button moved off the titlebar (Tasks 2,5), placeholder Search/SCM/Extensions panels (Task 4). The `spatial` view shows a placeholder in P1 (office-focus is later). Search/SCM real content = P4; editor tabs/file view = P2 — correctly out of this plan.
- **Build-green ordering:** each task compiles independently — `isReal`/`onOpenFolder` are optional (Task 2) so App compiles before Task 5 wires them; Sidebar (Task 4) isn't mounted until Task 5.
- **Type consistency:** `ActiveView` (types.ts) is used identically in store, ActivityBar, and Sidebar's switch; `ProjectTree` is the existing export from `src/hooks/useProjectTree.ts`; `setActiveView(v: ActiveView)` signature matches all call sites.
- **No placeholders in the plan** (the UI "placeholder panels" are intentional product stubs with full code given, not plan gaps).
