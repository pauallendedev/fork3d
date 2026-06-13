import { GATE_ACTIONS } from '../data/gateActions'
import { useStore } from '../state/store'
import './SecurityGatePanel.css'

function Icon({ name }: { name: string }) {
  let body = null
  switch (name) {
    case 'shield':
      body = (
        <>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
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
    case 'pr':
      body = (
        <>
          <circle cx={6} cy={6} r={2.5} />
          <circle cx={6} cy={18} r={2.5} />
          <circle cx={18} cy={18} r={2.5} />
          <path d="M6 8.5v7" />
          <path d="M13 5h3a2 2 0 0 1 2 2v8.5" />
          <path d="M15 7.5L13 5l2-2.5" />
        </>
      )
      break
    case 'diff':
      body = (
        <>
          <path d="M9 7h6" />
          <path d="M12 4v6" />
          <path d="M9 17h6" />
          <path d="M5 3v18" />
          <path d="M19 3v18" />
        </>
      )
      break
    case 'commit':
      body = (
        <>
          <circle cx={12} cy={12} r={3.5} />
          <path d="M2 12h6.5M15.5 12H22" />
        </>
      )
      break
    case 'push':
      body = (
        <>
          <path d="M12 19V7" />
          <path d="M7 12l5-5 5 5" />
          <path d="M5 4h14" />
        </>
      )
      break
    case 'rules':
      body = (
        <>
          <circle cx={8} cy={15} r={4} />
          <path d="M11 12L20 3" />
          <path d="M17 6l3 3" />
          <path d="M14 9l2 2" />
        </>
      )
      break
    case 'merge':
      body = (
        <>
          <circle cx={6} cy={5} r={2.5} />
          <circle cx={6} cy={19} r={2.5} />
          <circle cx={18} cy={12} r={2.5} />
          <path d="M6 7.5v9" />
          <path d="M6 9c0 3 5 3 9.5 3" />
        </>
      )
      break
    case 'approve':
      body = (
        <>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </>
      )
      break
    case 'duplicate':
      body = (
        <>
          <rect x={9} y={9} width={11} height={11} rx={2} />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </>
      )
      break
    case 'more':
      body = (
        <>
          <circle cx={5} cy={12} r={1} />
          <circle cx={12} cy={12} r={1} />
          <circle cx={19} cy={12} r={1} />
        </>
      )
      break
    case 'chevron-right':
      body = <path d="M9 6l6 6-6 6" />
      break
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
  )
}

export function SecurityGatePanel() {
  const runGateAction = useStore((s) => s.runGateAction)
  return (
    <div className="sg-root">
      <div className="sg-header">
        <div className="sg-shield">
          <Icon name="shield" />
        </div>
        <div className="sg-headtext">
          <div className="sg-name">SECURITY GATE</div>
          <div className="sg-granted">Access Granted</div>
        </div>
        <button className="sg-more" aria-label="More">
          <Icon name="more" />
        </button>
      </div>
      <div className="sg-source">
        <div className="sg-source-icon">
          <Icon name="branch" />
        </div>
        <div>
          <div className="sg-source-label">SOURCE_CONTROL</div>
          <div className="sg-source-env">staging environment</div>
        </div>
      </div>
      <div className="sg-list">
        {GATE_ACTIONS.map((a) => (
          <button key={a.id} className="sg-row" onClick={() => runGateAction(a.id)}>
            <span className="sg-tile">
              <Icon name={a.icon} />
            </span>
            <span className="sg-rowtext">
              <span className="sg-rowtitle">{a.title}</span>
              <span className="sg-rowsub">{a.subtitle}</span>
            </span>
          </button>
        ))}
        <button className="sg-row sg-row-more">
          <span className="sg-tile">
            <Icon name="more" />
          </span>
          <span className="sg-rowtext">
            <span className="sg-rowtitle">More Actions</span>
          </span>
          <span className="sg-chev">
            <Icon name="chevron-right" />
          </span>
        </button>
      </div>
    </div>
  )
}
