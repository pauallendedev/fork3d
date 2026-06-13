/**
 * Whiteboard — flat 2D wall art (§8), right wall. Drawn around local origin =
 * base-center on the floor line; the board hangs 40px above the floor line,
 * so content spans y from −160 to −40 (~190 wide × 120 tall). The parent
 * wraps it in wallRight(ANCHORS.whiteboard).
 */
export function Whiteboard() {
  return (
    <g>
      {/* frame + white board */}
      <rect x={-95} y={-160} width={190} height={120} rx={8} fill="var(--border-strong)" />
      <rect x={-89} y={-154} width={178} height={108} rx={5} fill="#ffffff" />

      {/* flowchart elbow connectors (drawn under the nodes) */}
      <g fill="none" stroke="#b7c2d0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M -56 -128 V -106 H -20" />
        <path d="M 40 -128 V -106 H 20" />
        <path d="M 0 -98 V -90 H -58 V -82" />
        <path d="M 0 -98 V -90 H 54 V -82" />
      </g>

      {/* 5 rounded flowchart nodes */}
      <rect x={-74} y={-144} width={36} height={16} rx={4} fill="#dce7f8" />
      <rect x={22} y={-144} width={36} height={16} rx={4} fill="#ddf3e7" />
      <rect x={-20} y={-114} width={40} height={16} rx={4} fill="#fdeec9" />
      <rect x={-76} y={-82} width={36} height={16} rx={4} fill="#ddf3e7" />
      <rect x={36} y={-82} width={36} height={16} rx={4} fill="#dce7f8" />

      {/* 2 scribble underlines */}
      <g fill="none" stroke="#b7c2d0" strokeWidth={1.5} strokeLinecap="round">
        <path d="M -72 -58 q 5 -4 10 0 t 10 0 t 10 0" />
        <path d="M 32 -58 q 5 -4 10 0 t 10 0" />
      </g>

      {/* marker tray below the board, with two markers resting on it */}
      <rect x={-36} y={-41} width={72} height={7} rx={3} fill="var(--border-strong)" />
      <rect x={-28} y={-45} width={16} height={4} rx={2} fill="#3f8cfa" />
      <rect x={-6} y={-45} width={16} height={4} rx={2} fill="#e5484d" />
    </g>
  )
}
