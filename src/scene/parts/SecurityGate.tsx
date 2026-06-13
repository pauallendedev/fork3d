import { GroundShadow, IsoBox, RX, RY, p2 } from '../iso'

const px = (a: number, b: number, h = 0) =>
  `translate(${(RX * (a - b)).toFixed(1)} ${(RY * (a + b) - h).toFixed(1)})`

function Check({ a, b, h }: { a: number; b: number; h: number }) {
  return (
    <g transform={px(a, b, h)}>
      <circle r={9} fill="var(--green)" />
      <path
        d="M -3.5 0 L -1 2.5 L 3.5 -2.5"
        stroke="#ffffff"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

function Pillar() {
  return <IsoBox w={18} d={18} h={95} top="#fbfcfd" left="#e9edf2" right="#dde3ea" />
}

export function SecurityGate() {
  return (
    <g>
      <GroundShadow w={170} opacity={0.08} />
      {/* base plate */}
      <IsoBox w={26} d={150} h={6} top="#e8ecf1" left="#d5dae2" right="#cdd4dd" />
      {/* far pillar (up-right) */}
      <g transform={px(0, -66)}>
        <Pillar />
        <g transform={px(2, 8, 78)}>
          <circle r={2.5} fill="var(--green)" />
        </g>
      </g>
      {/* glass panels */}
      <polygon
        points={`${p2(0, -52, 84)} ${p2(0, -8, 84)} ${p2(0, -8, 6)} ${p2(0, -52, 6)}`}
        fill="#bfd8e6"
        opacity={0.38}
      />
      <polyline points={`${p2(0, -52, 84)} ${p2(0, -8, 84)}`} stroke="#ffffff" strokeWidth={2.5} fill="none" />
      <polygon
        points={`${p2(0, 8, 84)} ${p2(0, 52, 84)} ${p2(0, 52, 6)} ${p2(0, 8, 6)}`}
        fill="#bfd8e6"
        opacity={0.38}
      />
      <polyline points={`${p2(0, 8, 84)} ${p2(0, 52, 84)}`} stroke="#ffffff" strokeWidth={2.5} fill="none" />
      <Check a={0} b={-30} h={48} />
      <Check a={0} b={30} h={48} />
      {/* near pillar (down-left) */}
      <g transform={px(0, 66)}>
        <Pillar />
        <g transform={px(2, -8, 78)}>
          <circle r={2.5} fill="var(--green)" />
        </g>
      </g>
    </g>
  )
}
