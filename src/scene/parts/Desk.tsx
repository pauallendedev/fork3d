import { GroundShadow, IsoBox, RX, RY, p2 } from '../iso'

const px = (a: number, b: number, h = 0) =>
  `translate(${(RX * (a - b)).toFixed(1)} ${(RY * (a + b) - h).toFixed(1)})`

function Monitor() {
  return (
    <g>
      <IsoBox w={7} d={56} h={38} top="#2a3240" left="#232a36" right="#1f2430" />
      {/* screen on the down-right face */}
      <polygon points={`${p2(3.6, -25, 35)} ${p2(3.6, 25, 35)} ${p2(3.6, 25, 4)} ${p2(3.6, -25, 4)}`} fill="#1b2230" />
      <polygon points={`${p2(3.7, -20, 30)} ${p2(3.7, 8, 30)} ${p2(3.7, 8, 27)} ${p2(3.7, -20, 27)}`} fill="#7fb3ff" />
      <polygon points={`${p2(3.7, -20, 25)} ${p2(3.7, 18, 25)} ${p2(3.7, 18, 22)} ${p2(3.7, -20, 22)}`} fill="#8be3ae" />
      <polygon points={`${p2(3.7, -20, 20)} ${p2(3.7, 0, 20)} ${p2(3.7, 0, 17)} ${p2(3.7, -20, 17)}`} fill="#c9b3ff" />
      <polygon points={`${p2(3.7, -20, 15)} ${p2(3.7, 12, 15)} ${p2(3.7, 12, 12.5)} ${p2(3.7, -20, 12.5)}`} fill="#5b6472" />
      <polygon points={`${p2(3.7, -20, 10.5)} ${p2(3.7, 4, 10.5)} ${p2(3.7, 4, 8)} ${p2(3.7, -20, 8)}`} fill="#7fb3ff" />
    </g>
  )
}

/** Office chair, positioned where the blue agent sits (rendered before bots). */
export function DeskChair() {
  return (
    <g transform="translate(-114 -8)">
      <GroundShadow w={50} opacity={0.07} />
      {/* 5-star base */}
      <g stroke="#98a1ae" strokeWidth={2.5} strokeLinecap="round">
        <line x1={0} y1={-3} x2={15} y2={4} />
        <line x1={0} y1={-3} x2={-15} y2={4} />
        <line x1={0} y1={-3} x2={9} y2={-9} />
        <line x1={0} y1={-3} x2={-9} y2={-9} />
        <line x1={0} y1={-3} x2={0} y2={7} />
      </g>
      <rect x={-1.5} y={-26} width={3} height={24} fill="#98a1ae" />
      {/* backrest (up-left of the seat) */}
      <g transform={px(-17, 0, 28)}>
        <IsoBox w={6} d={34} h={36} top="#454d5b" left="#39414e" right="#313845" />
      </g>
      {/* seat */}
      <g transform="translate(0 -24)">
        <IsoBox w={34} d={34} h={7} top="#454d5b" left="#39414e" right="#313845" />
      </g>
    </g>
  )
}

export function Desk() {
  return (
    <g>
      <GroundShadow w={220} opacity={0.08} />
      {/* legs (back to front) */}
      <g transform={px(-28, -105)}>
        <IsoBox w={8} d={8} h={58} top="#d5dae2" left="#c9d1db" right="#bfc8d3" />
      </g>
      <g transform={px(28, -105)}>
        <IsoBox w={8} d={8} h={58} top="#d5dae2" left="#c9d1db" right="#bfc8d3" />
      </g>
      <g transform={px(-28, 105)}>
        <IsoBox w={8} d={8} h={58} top="#d5dae2" left="#c9d1db" right="#bfc8d3" />
      </g>
      <g transform={px(28, 105)}>
        <IsoBox w={8} d={8} h={58} top="#d5dae2" left="#c9d1db" right="#bfc8d3" />
      </g>
      {/* desktop */}
      <g transform="translate(0 -58)">
        <IsoBox w={80} d={240} h={8} top="#fbfcfd" left="#e3e8ef" right="#d9dfe7" />
      </g>
      {/* monitors (far one first) */}
      <g transform={px(-12, -44, 62)}>
        <Monitor />
      </g>
      <g transform={px(-12, 30, 62)}>
        <Monitor />
      </g>
      {/* keyboard */}
      <g transform={px(20, -6, 62)}>
        <IsoBox w={16} d={52} h={3} top="#e8ecf1" left="#d5dae2" right="#cdd4dd" />
      </g>
      {/* mug */}
      <g transform={px(14, -92, 62)}>
        <IsoBox w={9} d={9} h={11} top="#ffffff" left="#eef1f5" right="#e3e8ef" />
      </g>
    </g>
  )
}
