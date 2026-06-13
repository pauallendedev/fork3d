import { useStore } from '../../state/store'
import { RADIAL_SEGMENTS } from '../../data/radial'
import { AGENT_POS, RADIAL_OFFSET } from '../layout'
import './RadialMenu.css'

const R_OUT = 86
const R_IN = 30
const R_ICON = 58

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
}

function wedgePath(a1: number, a2: number) {
  const o1 = polar(R_OUT, a1)
  const o2 = polar(R_OUT, a2)
  const i1 = polar(R_IN, a1)
  const i2 = polar(R_IN, a2)
  const f = (n: number) => n.toFixed(2)
  return `M ${f(o1.x)} ${f(o1.y)} A ${R_OUT} ${R_OUT} 0 0 1 ${f(o2.x)} ${f(o2.y)} L ${f(i2.x)} ${f(i2.y)} A ${R_IN} ${R_IN} 0 0 0 ${f(i1.x)} ${f(i1.y)} Z`
}

function Icon({ name }: { name: string }) {
  let body = null
  switch (name) {
    case 'plus-agent':
      body = (
        <>
          <circle cx={9} cy={8} r={3.5} />
          <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <path d="M18 6v6M15 9h6" />
        </>
      )
      break
    case 'inbox':
      body = (
        <>
          <path d="M3 13l2-7h14l2 7v6H3z" />
          <path d="M3 13h5l2 3h4l2-3h5" />
        </>
      )
      break
    case 'branch':
      body = (
        <>
          <circle cx={6} cy={5} r={2.5} />
          <circle cx={6} cy={19} r={2.5} />
          <circle cx={18} cy={8} r={2.5} />
          <path d="M6 7.5v9" />
          <path d="M18 10.5c0 4-5 4-9 5.5" />
        </>
      )
      break
    case 'refresh':
      body = (
        <>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </>
      )
      break
    case 'download':
      body = (
        <>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 19h16" />
        </>
      )
      break
    case 'copy':
      body = (
        <>
          <rect x={9} y={9} width={11} height={11} rx={2} />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </>
      )
      break
    case 'lock':
      body = (
        <>
          <rect x={5} y={11} width={14} height={9} rx={2} />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      )
      break
    case 'gear':
      body = (
        <>
          <circle cx={12} cy={12} r={3} />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
        </>
      )
      break
    case 'shield':
      body = <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      break
  }
  return (
    <g fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {body}
    </g>
  )
}

export function RadialMenu() {
  const radialFor = useStore((s) => s.radialFor)
  const runRadialAction = useStore((s) => s.runRadialAction)
  const setRadial = useStore((s) => s.setRadial)
  if (!radialFor) return null
  const p = AGENT_POS[radialFor]
  return (
    <g className="rm-root" transform={`translate(${p.x + RADIAL_OFFSET.dx} ${p.y + RADIAL_OFFSET.dy})`}>
      <defs>
        <filter id="rm-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.16" />
        </filter>
      </defs>
      <g filter="url(#rm-shadow)">
        {RADIAL_SEGMENTS.map((seg, i) => {
          const center = -90 + i * 45
          const mid = polar(R_ICON, center)
          return (
            <g
              key={seg.id}
              className={`rm-seg${seg.active ? ' rm-active' : ''}`}
              onClick={() => runRadialAction(seg.id)}
            >
              <title>{seg.label}</title>
              <path className="rm-wedge" d={wedgePath(center - 21, center + 21)} />
              <g className="rm-icon" transform={`translate(${(mid.x - 7.5).toFixed(1)} ${(mid.y - 7.5).toFixed(1)}) scale(0.625)`}>
                <Icon name={seg.icon} />
              </g>
            </g>
          )
        })}
        <g className="rm-center" onClick={() => setRadial(null)}>
          <circle className="rm-center-circle" r={26} />
          <g transform="translate(-8 -8) scale(0.667)">
            <Icon name="shield" />
          </g>
        </g>
      </g>
    </g>
  )
}
