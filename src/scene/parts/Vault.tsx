/**
 * Vault — flat 2D wall art (§8), left wall. Drawn around local origin =
 * base-center on the floor line; content extends UP in −y (~120 wide × 140
 * tall, y from −140 to 0). The parent wraps it in wallLeft(ANCHORS.vault).
 */
export function Vault() {
  return (
    <g>
      {/* dark wall panel, inset on the wall */}
      <rect x={-60} y={-140} width={120} height={140} rx={10} fill="var(--ink)" />

      {/* lighter inner door */}
      <rect x={-48} y={-127} width={96} height={114} rx={7} fill="#4a5260" />
      {/* subtle door edge highlight */}
      <rect
        x={-48}
        y={-127}
        width={96}
        height={114}
        rx={7}
        fill="none"
        stroke="#5a6273"
        strokeWidth={1.5}
      />

      {/* two small hinges on the right edge of the door */}
      <rect x={41} y={-106} width={11} height={13} rx={2.5} fill="#98a1ae" />
      <rect x={41} y={-49} width={11} height={13} rx={2.5} fill="#98a1ae" />

      {/* circular wheel: outer ring r26 + 4 spokes + center cap */}
      <circle cx={0} cy={-70} r={26} fill="none" stroke="#98a1ae" strokeWidth={5} />
      <g stroke="#98a1ae" strokeWidth={4} strokeLinecap="round">
        <line x1={0} y1={-70} x2={0} y2={-96} />
        <line x1={0} y1={-70} x2={26} y2={-70} />
        <line x1={0} y1={-70} x2={0} y2={-44} />
        <line x1={0} y1={-70} x2={-26} y2={-70} />
      </g>
      <circle cx={0} cy={-70} r={7} fill="#98a1ae" />
      <circle cx={0} cy={-70} r={2.5} fill="#39414e" />

      {/* tiny green LED, top-left — soft glow + blinking pulse */}
      <circle cx={-53} cy={-133} r={6} fill="var(--green)" opacity={0.25}>
        <animate
          attributeName="opacity"
          values="0.25;0.08;0.25"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={-53} cy={-133} r={3} fill="var(--green)">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}
