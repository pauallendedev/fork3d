import { toPct } from './iso'
import { BADGES } from './layout'
import './SceneBadges.css'

export function SceneBadges() {
  return (
    <div className="bd-overlay">
      {BADGES.map((b) => (
        <div key={b.id} className={`bd-pill bd-${b.variant}`} style={toPct(b.p)}>
          <div className="bd-title">
            {b.dot && <span className="bd-dot" style={{ background: b.dot }} />}
            {b.title}
          </div>
          <div className="bd-sub">{b.subtitle}</div>
        </div>
      ))}
    </div>
  )
}
