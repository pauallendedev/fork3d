import { GroundShadow, IsoBox, RX, RY } from '../iso'

const px = (a: number, b: number, h = 0) =>
  `translate(${(RX * (a - b)).toFixed(1)} ${(RY * (a + b) - h).toFixed(1)})`

export function Couch() {
  return (
    <g>
      <GroundShadow w={160} opacity={0.09} />
      {/* far armrest (up-right end) */}
      <g transform={px(0, -68)}>
        <IsoBox w={54} d={14} h={42} top="#e5484d" left="#d13f44" right="#c93a3f" />
      </g>
      {/* backrest along the rear edge */}
      <g transform={px(-22, 0)}>
        <IsoBox w={14} d={150} h={56} top="var(--agent-red)" left="#d13f44" right="#c93a3f" />
      </g>
      {/* base */}
      <IsoBox w={56} d={150} h={22} top="#d13f44" left="#c93a3f" right="#bd3338" />
      {/* seat cushions */}
      <g transform={px(2, -34, 22)}>
        <IsoBox w={46} d={62} h={9} top="#eb5d62" left="#e04f55" right="#d8474c" />
      </g>
      <g transform={px(2, 34, 22)}>
        <IsoBox w={46} d={62} h={9} top="#eb5d62" left="#e04f55" right="#d8474c" />
      </g>
      {/* near armrest */}
      <g transform={px(0, 68)}>
        <IsoBox w={54} d={14} h={42} top="#e5484d" left="#d13f44" right="#c93a3f" />
      </g>
    </g>
  )
}
