# ForkCode — Design Specification

ForkCode is a VS Code-style "fork" where the editor surface is replaced by an
isometric 3D office in which six AI agents work. This document is the single
source of truth: it transcribes a Figma mock pixel-for-pixel. Follow it exactly,
including every UI string.

The product brand shown in the UI is **SAMS — Spatial Agentic Management System**.

## §1 Tech & conventions

- React 19 + TypeScript (strict), Vite. Only dependencies: `react`, `react-dom`, `zustand`. **No new packages, no Tailwind, no icon libraries.**
- `verbatimModuleSyntax` is on: use `import type { … }` for type-only imports.
- Plain CSS files co-located with components (`import './X.css'`). Every component uses its assigned class prefix (see §14) to avoid collisions.
- All icons are inline SVG, lucide style: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.7}`, `strokeLinecap="round"`, `strokeLinejoin="round"`, rendered at 14–16 px. Keep them simple (2–4 paths).
- Use CSS variables from `src/styles/tokens.css` everywhere; never hardcode hex values that exist as tokens.
- Global state: `useStore` from `src/state/store.ts` (zustand). Read its source — all actions you need already exist (selectAgent, setRadial, setPalette, setPaletteQuery, setBottomTab, setZoom, pushLog, runGateAction, runRadialAction, runCommand). Do not modify shared files.
- Everything is mouse-interactive: hover states on every clickable row/button (background `var(--bg-hover)` unless specified).

## §2 App layout (the shell)

```
┌──────────────────────────── TitleBar 48px ────────────────────────────┐
├──┬───────────┬───────────────────────────────────────┬───────────────┤
│A │ Explorer  │           OfficeScene (flex 1)        │ SystemOverview│
│c │ 244px     │   (CommandPalette floats centered     │ 296px         │
│t │           │    at the top of this column)         │ ─────────────│
│64│           ├───────────────────────────────────────┤ SecurityGate  │
│px│           │           BottomPanel 224px           │ Panel         │
├──┴───────────┴───────────────────────────────────────┴───────────────┤
└──────────────────────────── StatusBar 28px ───────────────────────────┘
```

- App background `var(--bg-canvas)`. The four content areas (Explorer, scene,
  BottomPanel, right cards) sit as **floating white cards**: background
  `var(--bg-panel)`, border `1px solid var(--border)`, radius
  `var(--radius-card)`, shadow `var(--shadow-card)`, separated by 10 px gutters.
  (The scene area itself is a card with a very light interior.)
- Base font size 13px; small text 11–12px; section labels 10–11px uppercase
  with letter-spacing 0.06em, color `var(--text-3)`, weight 600.

## §3 TitleBar (prefix `tb-`)

Height 48, background white, bottom border. Left → right:

1. macOS traffic lights: three 12px circles (#ff5f57, #febc2e, #28c840), gap 8, decorative.
2. Logo: 26px rounded(8) square, background `var(--accent)`, containing a tiny
   white robot glyph (circle head + two eyes is fine). Next to it: **SAMS**
   (13px, weight 700) then a 1px divider then **Spatial Agentic Management System**
   (11px, `var(--text-3)`).
3. Right side: four 28px ghost icon buttons (radius 7, hover `var(--bg-hover)`),
   icons: panels-layout, inbox tray, cloud, grid-of-squares. Decorative.

## §4 CommandPalette (prefix `cp-`)

Floats horizontally centered near the top of the scene column (absolute,
top 10px, width 460px, z-index above scene).

- Search bar: white, radius 12, border, shadow `var(--shadow-float)`, height 44.
  Inside: search icon (16, `var(--text-3)`), input with placeholder
  `Type a command or search...`, and on the right two keycaps `⌘` `K`
  (22px squares, radius 6, border, background `var(--bg-subtle)`, 11px text).
- When open (store `paletteOpen`, **open by default**), a dropdown card hangs
  6px below: same styling, padding 6. It lists commands from
  `src/data/commands.ts` filtered by `paletteQuery` (case-insensitive substring
  of title). Each row (radius 8, padding 8 10): a 28px rounded(8) icon tile
  (background `var(--accent-soft)`, icon `var(--accent)` 15px), then title
  (12.5px, 600) over subtitle (11px, `var(--text-2)`), and the kbd shortcut
  right-aligned as keycaps. First row / hovered row background `var(--bg-active)`.
  Click → `runCommand(id)`.
- Keyboard (global listener in this component): `⌘K` toggles palette, `⌘O`
  runs `open-agent`, `Escape` closes, typing filters via `setPaletteQuery`.
  Focus the input when opening.

## §5 ActivityBar (prefix `ab-`) and StatusBar (prefix `sb-`)

**ActivityBar**: width 64, white card (it can be a plain column inside the shell
card). Vertical stack of 5 items, each: 40px rounded(10) icon tile + 8.5px label
underneath (`var(--text-3)`). Items: `Explorer` (files icon, **active**: tile
background `var(--accent)`, icon white, label `var(--accent)`), `Search`
(magnifier), `Source Control` (git branch), `Spatial CAD` (3d cube), `Extensions`
(four squares). Inactive tiles: icon `var(--text-2)`, hover `var(--bg-hover)`.
Pinned at the bottom: a 30px round avatar (background `var(--ink-deep)`, tiny
white robot face) with label `Online` in `var(--green)` (8.5px, weight 600).

**StatusBar**: height 28, white, top border, 11px, `var(--text-2)`; items are
small hover-able pills (padding 0 7). Left group: branch icon + `main*` · sync
icon · error(circle-slash) icon + `0` · warning(triangle) icon + `2`. Right
group: `Spaces: 2` · `UTF-8` · `LF` · `YAML` · green 7px dot + `SAMS: Connected`
· bell icon. Clicking the warnings pill switches the bottom tab to `problems`.

## §6 Explorer (prefix `ex-`)

Width 244. Header row: `EXPLORER` (section label style) + `…` icon button at
right. Below: the workspace tree from `src/data/workspace.ts`
(`WORKSPACE_NAME = SAMS-WORKSPACE` is the root row, weight 700, 11px, with a
chevron; expanded by default).

Rows: height 24, padding-left = 10 + depth×14, 12.5px. Folder rows: chevron
(rotates when open) + folder icon (`var(--text-2)`, filled folder shape with
fill `#dbe4f0` and no stroke is fine) + name. All folders expanded by default;
clicking toggles. File rows: type icon + name + right-aligned badge:

- `M` → 11px bold letter, color `var(--orange)`
- `U` → 11px bold letter, color `var(--text-3)`
- `check` → small ✓ icon, `var(--green)`
- `dot` → 8px filled circle, `var(--orange)`

File icons by `icon` field: `agent` → 9px filled circle in `AGENT_CSS[color]`;
`flow` → small flow/branch glyph `var(--purple)`; `env` → sliders glyph
`var(--text-2)`; `spatial` → 3d cube `var(--accent)`; `yaml` → braces/gear
`var(--text-2)`; `md` → document `var(--text-2)`; `license` → scale/award
`var(--text-2)`.

Clicking an agent file selects that agent (`selectAgent(color)`); the row of the
selected agent shows background `var(--bg-active)`.

Bottom of the sidebar (pinned): two collapsed section headers `OUTLINE` and
`TIMELINE` with right-pointing chevrons, section label style, top border.

## §7 Scene geometry (READ CAREFULLY)

The scene is one `<svg viewBox="0 0 1160 760">` inside the scene card. ALL
geometry uses helpers from `src/scene/iso.tsx` — read that file. Floor corners:
L(150,425) T(580,210) R(1010,425) B(580,640). Wall height `WALL_H = 200`
(from `src/scene/layout.ts`, which also has every anchor point — use them).

- **Edge directions** (for hand-drawn iso shapes): "down-right" = (0.894, 0.447),
  "down-left" = (−0.894, 0.447). Use `p2(a, b, h)` to build polygon points.
- **Painter's order** (back → front): Room → wall fixtures (Vault, Whiteboard,
  KanbanWall) → couch/plants/desk → SecurityGate → agents → RadialMenu.
- **Wall artwork** (vault, whiteboard, kanban): draw FLAT 2D art with origin at
  the base-center on the floor line, content extending upward in −y; the parent
  wraps it in `wallLeft(anchor)` / `wallRight(anchor)` which skews it onto the
  wall plane. Do NOT apply wall transforms yourself; export plain `<g>` content.
- **Floor props & agents**: drawn around local origin = floor contact center;
  parent positions with `at(anchor)`.

### Scene palette
Floor `var(--iso-floor)` with grid lines `var(--iso-floor-grid)` every 0.1 u/v
(thin, opacity .7); floor slab edge faces below the front edges (14px tall,
`var(--iso-floor-edge)`). Left-back wall `var(--wall-left)`, right-back wall
`var(--wall-right)`, both with a white top edge strip (6px) and a soft inner
baseboard line. Behind everything: nothing (card background shows through).
Soft large ellipse shadow under the whole floor (rgba(31,41,55,.07), blur via
opacity layering is fine).

## §8 Scene fixtures

**Wall text** (part of Room): on the left wall at `ANCHORS.samsText`:
`SAMS` — Inter 800, ~46px, fill `var(--ink)`, letter-spacing 2; below it
`SPATIAL-AGENTIC MANAGEMENT SYSTEM` 10px, letter-spacing 3, `var(--text-3)`.
Baseline ~95px above the floor line (i.e. y from −95).

**Vault** (left wall, anchor `ANCHORS.vault`): flat art ~120 wide × 140 tall:
dark rounded panel `var(--ink)` (radius 10) inset on the wall, lighter inner
door `#4a5260` with a circular wheel: outer ring `#98a1ae` r 26, 4 spokes,
center cap; two small hinges on the right edge; a tiny green LED (r 3,
`var(--green)`) top-left.

**Whiteboard** (right wall, anchor `ANCHORS.whiteboard`): flat art ~190 wide ×
120 tall, base lifted 40px above floor (start content at y=−40): white board,
frame `var(--border-strong)` (radius 8), marker tray below. Content: a small
flowchart — 5 rounded nodes (fills `#dce7f8`, `#ddf3e7`, `#fdeec9`) connected
by 1.5px `#b7c2d0` elbow lines, plus 2 scribble underlines.

**KanbanWall** (right wall, anchor `ANCHORS.kanban`): flat art ~200 wide ×
130 tall starting at y=−30: a subtle backing panel (`var(--bg-subtle)`, radius
8), 4 columns each with a 22×4 header bar (`var(--text-3)`) and 2–4 sticky
notes (16×16, radius 3, slight rotations) per column. Sticky colors: column 1
`#bfd8fe`, column 2 `#fde68a`, column 3 `#bbe7c9`, column 4 `#fecdd3`. Vary
counts: 4, 3, 2, 3.

**SecurityGate** (floor, anchor `ANCHORS.gate`): an iso turnstile ~150 wide
along the down-right direction: two white pillar IsoBoxes (w 18 d 18 h 95) at
each end, between them two glass panels (polygons in the same vertical plane,
fill `#bfd8e6` opacity .38, white 2px top edge) with a gap in the middle; a
green check circle (r 9, `var(--green)`, white ✓) floating on each glass panel;
low base plates (IsoBox w 150 d 26 h 6). LED strip on the inner edge of each
pillar in `var(--green)`.

## §9 Furniture

**Desk** (anchor `ANCHORS.desk`): iso desk ~ w 200 d 90: white top (IsoBox
w 200 d 90 h 58 with thin top, or top slab IsoBox h 6 on 4 thin legs — pick the
nicer look), legs `#c9d1db`. On top: TWO monitors side by side facing
front-left (the viewer): each monitor = thin vertical slab (dark frame
`var(--ink-deep)`, screen `#1b2230`) with 4–5 tiny rounded code lines
(2.5px tall) in `#7fb3ff`, `#8be3ae`, `#c9b3ff`, `#5b6472`; central stand.
A small keyboard slab and a mug in front. An office chair behind the desk
(seat + back `var(--ink)`, center pole and 5-star base `#98a1ae`) where the
blue agent sits.

**Couch** (anchor `ANCHORS.couch`): iso two-seater facing down-right:
base IsoBox w 150 d 60 h 26 in `#d13f44`, backrest slab along the back-left
edge (h 34) in `var(--agent-red)`, two seat cushions `#eb5d62` with a seam,
two armrests (h 30) in `#d13f44`, tiny feet. Soft GroundShadow.

**Plant** (anchors plantA/plantB/plantC): pot = small IsoBox (w 26 d 26 h 18,
tops `#e8ecf1`, sides `#d5dae2`), 5–7 leaves: simple leaf paths in `#34b873` /
`#2e9d62` fanning upward ~36px. GroundShadow w 40.

## §10 Agents (the robots) — file `AgentBot.tsx` + `AgentsLayer.tsx`

Cute chibi robots drawn **billboard style in screen space** (no iso skew),
origin at feet center, total height ~76px:

- Body: vertical capsule ~44 wide × 54 tall (rect rx 21), fill = agent color,
  plus a subtle darker bottom shade (same color, brightness .9, bottom half
  clip or simple ellipse overlay at low opacity).
- Visor: rounded rect 28×16 r 8, `var(--ink-deep)`, centered ~14px from body
  top; two white eye circles r 2.6, gap 10. Eyes blink: scaleY 1→0.1→1 for
  120ms every ~4s (CSS animation, staggered per agent via animation-delay).
- Antenna: 1.8px line rising 9px from head top + ball r 3.5 in a lighter tint.
- Arms: rounded rects 9×20 r 4.5 at the sides, same color slightly darker.
- Feet: two small dark ellipses (12×6, `var(--ink-deep)`, gap 8).
- GroundShadow w 54 under the feet.

Poses (`pose` prop): `stand` arms down · `sit` body lowered 10px, legs hidden,
small bent legs in front (two rounded rects angled forward) · `walk` arms
rotated ±18° opposite, one foot forward, plus a CSS sway animation · `point`
one arm raised 40° toward the wall behind.

Idle bob: whole bot translateY 0→−2.5→0 over 2.6s ease-in-out infinite,
`animation-delay` staggered by index. Use `transform-box: fill-box` so CSS
transforms work on SVG groups; the bob must be on an INNER group so it doesn't
fight the positioning transform.

**AgentsLayer**: renders all six bots from `useStore` at `AGENT_POS[id]`
(import from layout), sorted by screen y ascending (painter order). Click on a
bot → `selectAgent(id)`. Selected bot: a dashed ellipse ring under it
(rx 34, stroke `var(--accent)`, 1.5px, dash 4 4) and cursor pointer on all.
A tiny status dot (r 4) floats above each bot's antenna: working `var(--accent)`,
success `var(--green)`, warning `var(--orange)`, idle `var(--text-3)`.

## §11 Scene overlays

**RadialMenu** (`RadialMenu.tsx`, SVG group, prefix classes `rm-`): shown when
store `radialFor` ≠ null, centered at `AGENT_POS[radialFor] + RADIAL_OFFSET`
(parent positions it; the component draws around local 0,0). Donut: outer
r 86, inner r 30, 8 wedges with 3° gaps (order from `RADIAL_SEGMENTS`, first
wedge centered at 12 o'clock, clockwise). Wedge fill white, stroke
`var(--border)`; hover fill `#f1f5ff`; the `active` segment (branch) fill
`var(--accent)` with white icon. Icons (15px, stroke style per §1) placed at
radius 58 on each wedge's mid-angle: plus-agent(robot+plus or person+plus),
inbox(tray), branch(git branch), refresh(two arrows circle), download(arrow
into tray), copy(two rects), lock(padlock), gear. Center: white circle r 26
(stroke border) with a shield icon (`var(--ink)`), drop shadow on the whole
menu via `<filter><feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity="0.16"/></filter>`.
Click wedge → `runRadialAction(id)`. Click center → `setRadial(null)`.
Appear animation: scale .85→1 + fade, 160ms ease-out (CSS, transform-box fill-box).

**SceneBadges** (`SceneBadges.tsx` + css, prefix `bd-`): HTML overlay
(absolute, inset 0, pointer-events none) inside the scene stage. For each badge
in `BADGES` (layout.ts): a pill positioned with `toPct(p)` and
`transform: translate(-50%, -50%)`. Light variant: white, border, shadow-card,
radius 10, padding 6px 10px. Dark variant: background `var(--ink-deep)`, text
white, subtitle `#aab3c0`. Content: optional 7px dot (badge.dot) + **title**
(11px, 700) and subtitle (10px, `var(--text-2)` / dark variant `#aab3c0`) on
one or two lines: title on first line (with dot), subtitle below. Badges have
pointer-events auto and lift slightly on hover (translateY −1px).

## §12 Right panels

**SystemOverview** (`SystemOverview.tsx` + css, prefix `so-`): card. Header
(padding 12 14): `System Overview` (12.5px, 700) + chevron-down, `…` button at
right. Body: a 248×170 mini-map: a simplified iso room re-using `iso.tsx`
helpers BUT scaled — wrap in `<g transform="translate(-26 -10) scale(0.26)">`
(tweak so the floor diamond fits): floor diamond + the two walls only, light
fills, no props. On it, 6 map pins: for each agent a vertical 1px line (14px)
topped by a colored sphere r 5.5 in `AGENT_CSS[id]` at `AGENT_POS[id]` (scaled
with the same transform), with a soft white stroke. Pins pulse gently (scale).
Click pin → `selectAgent`. Footer row (top border, padding 8 14): left — 7px
green dot + `6 Agents Active` (11.5px, 600); right — zoom pill group: `−`
button, `{zoom}%` (11px, width 36, centered), `+` button (24px square ghost
buttons, border, radius 7). They call `setZoom(zoom ∓ 10 / ± 10)`.

**SecurityGatePanel** (`SecurityGatePanel.tsx` + css, prefix `sg-`): card,
fills remaining right-column height, scrolls if needed. Header (padding 12 14,
bottom border): a 30px rounded(9) tile `var(--green-soft)` with shield icon
`var(--green)`; beside it `SECURITY GATE` (11px, 700, letter-spacing .04em)
over `Access Granted` (11px, `var(--green)`, 600); `…` at right. Sub-block
(padding 10 14, bottom border): branch icon in a 26px tile `var(--bg-subtle)` +
`SOURCE_CONTROL` (10px section label) over `staging environment` (12px, 600).
Then the action list from `GATE_ACTIONS` (padding 6): rows radius 8, padding
7 8, gap 10: a 26px rounded(8) icon tile (`var(--bg-subtle)`, icon
`var(--text-2)` 14px) + title (12px, 600) over subtitle (10.5px,
`var(--text-2)`). Hover: row `var(--accent-soft)`, tile white, icon+title
`var(--accent)`. Click → `runGateAction(id)`. Icons: pr(git PR arrow),
diff(file-diff), commit(circle+dot), push(up arrow from line), rules(key),
merge(git merge), approve(shield check), duplicate(copy). Final row `More
Actions`: `…` icon tile + title only + chevron-right at far right; click does
nothing visible.

## §13 BottomPanel (prefix `bp-`)

Card, height 224, column flex. **Tab bar** (height 38, bottom border, padding
0 10): tabs `TERMINAL`, `OUTPUT`, `EVENT LOG`, `PROBLEMS` (11px, 600,
letter-spacing .03em, padding 0 10): active tab `var(--text-1)` with 2px
`var(--accent)` underline; inactive `var(--text-3)`. PROBLEMS has a count
pill (background `var(--accent)`, white, radius 8, 10px, padding 1 6) showing
store `problems`. Right side of tab bar: agent selector — 8px dot in selected
agent color + `{name}` (11.5px, mono optional) + chevron-down; clicking opens
a small dropdown (absolute, white card) listing all six agents (dot + name),
click selects (`selectAgent`). Then three ghost icon buttons: plus, split
(columns), trash. 

**Content row** (flex 1, min-height 0): left = log area (flex 1, scrollable,
font `var(--font-mono)` 11.5px, line-height 1.9, padding 8 14). Per tab:

- `terminal`: store logs — `{time}` `var(--text-3)` · agent name padded to
  14ch in `AGENT_CSS` color · `[{level}]` colored: INFO `var(--accent)`,
  SUCCESS `var(--green)`, WARN `var(--orange)`, ERROR `var(--red)`, IDLE
  `var(--text-3)` · message `var(--text-2)`. Auto-scroll to bottom on new logs
  (scrollTop = scrollHeight in an effect).
- `output`: static lines like `[10:41:02] vite v7.3.1 building for production...`,
  `[10:41:09] ✓ 312 modules transformed`, `[10:41:10] dist/index.html  0.92 kB`,
  `[10:41:14] build complete in 8.41s` (`var(--text-2)`; ✓ line green).
- `eventlog`: store logs rendered as event rows: time + a colored level chip
  (10px pill) + message.
- `problems`: two warning rows: triangle icon `var(--orange)` +
  `staging.env — unencrypted variable: DATABASE_URL` and
  `permissions.yaml — deprecated rule: allow-all-agents` + gray file refs.

**Task sidebar** (right, width 280, left border, padding 12 16, 12px): for the
selected agent: rows label/value — `Task` / task or `—`; `Branch` / branch in
mono 11px; `Status` / pill: working→`In Progress` (`var(--accent-soft)` bg,
`var(--accent)` text), success→`Done` (green soft), warning→`Waiting` (orange
soft `#fdf0dc`), idle→`Idle` (gray); `Progress` / 6px rounded track
`var(--bg-hover)` with fill `var(--accent)` at `{progress}%` + `{progress}%`
text right (11px). Labels 11px `var(--text-3)`, gap 12 between rows.

## §14 File map & class prefixes

| File | Prefix | Notes |
|---|---|---|
| src/components/TitleBar.tsx/.css | tb- | §3 |
| src/components/CommandPalette.tsx/.css | cp- | §4 |
| src/components/ActivityBar.tsx/.css | ab- | §5 |
| src/components/StatusBar.tsx/.css | sb- | §5 |
| src/components/Explorer.tsx/.css | ex- | §6 |
| src/components/SystemOverview.tsx/.css | so- | §12 |
| src/components/SecurityGatePanel.tsx/.css | sg- | §12 |
| src/components/BottomPanel.tsx/.css | bp- | §13 |
| src/scene/parts/Room.tsx | — | floor+walls+wall text (§7, §8) |
| src/scene/parts/Vault.tsx, Whiteboard.tsx, KanbanWall.tsx | — | flat wall art (§8) |
| src/scene/parts/SecurityGate.tsx, Desk.tsx, Couch.tsx, Plant.tsx | — | iso props (§8–9) |
| src/scene/parts/AgentBot.tsx, AgentsLayer.tsx (+AgentsLayer.css) | ag- | §10 |
| src/scene/parts/RadialMenu.tsx (+.css) | rm- | §11 |
| src/scene/SceneBadges.tsx/.css | bd- | §11 |
| src/scene/OfficeScene.tsx/.css | sc- | integration (do not create) |
| src/App.tsx/.css | app- | integration (do not create) |

Scene part components export a named function component returning a `<g>` (or
HTML for SceneBadges). They must render correctly when the parent applies the
positioning transform — never translate to absolute scene coordinates inside a
part (exception: Room and AgentsLayer/RadialMenu position themselves using
layout.ts anchors).
