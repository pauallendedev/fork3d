import { iso, wallLeft } from '../iso'
import type { Pt } from '../iso'
import { ANCHORS, WALL_H } from '../layout'

/** Floor corners in absolute scene coordinates. */
const L = iso(0, 0)
const T = iso(1, 0)
const R = iso(1, 1)
const B = iso(0, 1)

/** Height of the slab edge faces below the two front floor edges. */
const SLAB_H = 14
/** Height of the white strip along the top edge of each wall. */
const STRIP_H = 6

function pts(...points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

function up(p: Pt, dy: number): Pt {
  return { x: p.x, y: p.y - dy }
}

/** Grid line positions: every 0.1 in u and v (interior lines only). */
const GRID_STEPS = Array.from({ length: 9 }, (_, i) => (i + 1) / 10)

/**
 * The office room: floor shadow, floor diamond with iso grid, slab edges,
 * the two back walls with white top strips and baseboards, and the SAMS
 * wall text. Drawn in ABSOLUTE scene coordinates (Room positions itself).
 */
export function Room() {
  return (
    <g>
      {/* Soft large ellipse shadow under the whole floor (faux blur via layering) */}
      <ellipse cx={580} cy={450} rx={480} ry={160} fill="rgba(31, 41, 55, 0.05)" />
      <ellipse cx={580} cy={448} rx={450} ry={145} fill="rgba(31, 41, 55, 0.06)" />
      <ellipse cx={580} cy={446} rx={415} ry={130} fill="rgba(31, 41, 55, 0.07)" />

      {/* Floor diamond */}
      <polygon points={pts(L, T, R, B)} fill="var(--iso-floor)" />

      {/* Iso grid lines every 0.1 in u and v */}
      <g stroke="var(--iso-floor-grid)" strokeWidth={1} opacity={0.7}>
        {GRID_STEPS.map((t) => {
          const a = iso(t, 0)
          const b = iso(t, 1)
          return <line key={`u${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
        {GRID_STEPS.map((t) => {
          const a = iso(0, t)
          const b = iso(1, t)
          return <line key={`v${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      {/* 14px slab edge faces below the two front edges */}
      <polygon points={pts(L, B, up(B, -SLAB_H), up(L, -SLAB_H))} fill="var(--iso-floor-edge)" />
      <polygon points={pts(B, R, up(R, -SLAB_H), up(B, -SLAB_H))} fill="var(--iso-floor-edge)" />

      {/* Left-back wall (L → T raised WALL_H) */}
      <polygon points={pts(L, T, up(T, WALL_H), up(L, WALL_H))} fill="var(--wall-left)" />
      {/* Right-back wall (T → R raised WALL_H) */}
      <polygon points={pts(T, R, up(R, WALL_H), up(T, WALL_H))} fill="var(--wall-right)" />

      {/* 6px white top strip along the top edge of each wall */}
      <polygon
        points={pts(up(L, WALL_H), up(T, WALL_H), up(T, WALL_H - STRIP_H), up(L, WALL_H - STRIP_H))}
        fill="var(--bg-panel)"
      />
      <polygon
        points={pts(up(T, WALL_H), up(R, WALL_H), up(R, WALL_H - STRIP_H), up(T, WALL_H - STRIP_H))}
        fill="var(--bg-panel)"
      />

      {/* Faint baseboard line where each wall meets the floor */}
      <g stroke="rgba(31, 41, 55, 0.1)" strokeWidth={1.5}>
        <line x1={L.x} y1={L.y} x2={T.x} y2={T.y} />
        <line x1={T.x} y1={T.y} x2={R.x} y2={R.y} />
      </g>

      {/* SAMS wall text on the left wall */}
      <g transform={wallLeft(ANCHORS.samsText)}>
        <text
          x={0}
          y={-95}
          fontFamily="var(--font-ui)"
          fontWeight={800}
          fontSize={46}
          fill="var(--ink)"
          letterSpacing={2}
          style={{ textAnchor: 'start', userSelect: 'none' }}
        >
          SAMS
        </text>
        <text
          x={0}
          y={-78}
          fontFamily="var(--font-ui)"
          fontSize={10}
          fill="var(--text-3)"
          letterSpacing={3}
          style={{ textAnchor: 'start', userSelect: 'none' }}
        >
          SPATIAL-AGENTIC MANAGEMENT SYSTEM
        </text>
      </g>
    </g>
  )
}
