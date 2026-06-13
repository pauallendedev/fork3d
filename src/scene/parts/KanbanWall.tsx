/**
 * KanbanWall — flat 2D wall art (§8), right wall. Drawn around local origin =
 * base-center on the floor line; the panel starts 30px above the floor line,
 * so content spans y from −160 to −30 (~200 wide × 130 tall). The parent
 * wraps it in wallRight(ANCHORS.kanban).
 */

interface KanbanColumn {
  /** Column center x in local coordinates. */
  x: number
  /** Sticky note color for the column. */
  color: string
  /** One slight rotation (degrees) per sticky note. */
  notes: number[]
}

/** 4 columns with 4 / 3 / 2 / 3 sticky notes in the four spec colors. */
const COLUMNS: KanbanColumn[] = [
  { x: -75, color: '#bfd8fe', notes: [-4, 3, -2, 5] },
  { x: -25, color: '#fde68a', notes: [3, -5, 2] },
  { x: 25, color: '#bbe7c9', notes: [-3, 4] },
  { x: 75, color: '#fecdd3', notes: [5, -2, 3] },
]

const NOTE_TOP = -128
const NOTE_STEP = 23

export function KanbanWall() {
  return (
    <g>
      {/* subtle backing panel */}
      <rect
        x={-100}
        y={-160}
        width={200}
        height={130}
        rx={8}
        fill="var(--bg-subtle)"
        stroke="var(--border)"
        strokeWidth={1}
      />

      {COLUMNS.map((col) => (
        <g key={col.x}>
          {/* 22×4 column header bar */}
          <rect x={col.x - 11} y={-148} width={22} height={4} rx={2} fill="var(--text-3)" />

          {/* slightly-rotated 16×16 sticky notes */}
          {col.notes.map((rotation, i) => (
            <rect
              key={i}
              x={-8}
              y={-8}
              width={16}
              height={16}
              rx={3}
              fill={col.color}
              transform={`translate(${col.x} ${NOTE_TOP + i * NOTE_STEP}) rotate(${rotation})`}
            />
          ))}
        </g>
      ))}
    </g>
  )
}
