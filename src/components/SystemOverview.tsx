import type { CSSProperties } from 'react'
import { AGENT_CSS, AGENT_ORDER, useStore } from '../state/store'
import { iso } from '../scene/iso'
import type { Pt } from '../scene/iso'
import { AGENT_POS, WALL_H } from '../scene/layout'
import './SystemOverview.css'

const S = 0.27
const m = (p: Pt) => ({ x: (p.x - 130) * S, y: (p.y - 10) * S })

const L = m(iso(0, 0))
const T = m(iso(1, 0))
const R = m(iso(1, 1))
const B = m(iso(0, 1))
const WH = WALL_H * S

export function SystemOverview() {
  const zoom = useStore((s) => s.zoom)
  const setZoom = useStore((s) => s.setZoom)
  const selectAgent = useStore((s) => s.selectAgent)
  return (
    <div className="so-root">
      <div className="so-header">
        <span className="so-title">System Overview</span>
        <svg className="so-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
        <button className="so-more" aria-label="More">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx={5} cy={12} r={1.6} />
            <circle cx={12} cy={12} r={1.6} />
            <circle cx={19} cy={12} r={1.6} />
          </svg>
        </button>
      </div>
      <div className="so-map">
        <svg viewBox="0 0 248 170">
          <polygon
            points={`${L.x},${L.y - WH} ${T.x},${T.y - WH} ${T.x},${T.y} ${L.x},${L.y}`}
            fill="var(--wall-left)"
          />
          <polygon
            points={`${T.x},${T.y - WH} ${R.x},${R.y - WH} ${R.x},${R.y} ${T.x},${T.y}`}
            fill="var(--wall-right)"
          />
          <polygon
            points={`${L.x},${L.y} ${T.x},${T.y} ${R.x},${R.y} ${B.x},${B.y}`}
            fill="var(--iso-floor)"
            stroke="var(--iso-floor-edge)"
          />
          {AGENT_ORDER.map((id, i) => {
            const p = m(AGENT_POS[id])
            return (
              <g
                key={id}
                className="so-pin"
                style={{ '--so-i': i } as CSSProperties}
                onClick={() => selectAgent(id)}
              >
                <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 14} stroke="var(--text-3)" strokeWidth={1} />
                <circle className="so-ball" cx={p.x} cy={p.y - 19} r={5.5} fill={AGENT_CSS[id]} stroke="#ffffff" strokeWidth={1.5} />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="so-footer">
        <span className="so-active">
          <span className="so-dot" />
          {AGENT_ORDER.length} Agents Active
        </span>
        <div className="so-zoom">
          <button onClick={() => setZoom(zoom - 10)} aria-label="Zoom out">
            −
          </button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom(zoom + 10)} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>
    </div>
  )
}
