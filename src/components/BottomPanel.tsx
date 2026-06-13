import { useEffect, useRef, useState } from 'react'
import { AGENT_CSS, AGENT_ORDER, useStore } from '../state/store'
import type { AgentStatus, BottomTab, LogLevel } from '../state/types'
import './BottomPanel.css'

const LEVEL_COLOR: Record<LogLevel, string> = {
  INFO: 'var(--accent)',
  SUCCESS: 'var(--green)',
  WARN: 'var(--orange)',
  ERROR: 'var(--red)',
  IDLE: 'var(--text-3)',
}

const TABS: Array<{ id: BottomTab; label: string }> = [
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'output', label: 'OUTPUT' },
  { id: 'eventlog', label: 'EVENT LOG' },
  { id: 'problems', label: 'PROBLEMS' },
]

const OUTPUT_LINES = [
  '[10:41:02] vite v7.3.1 building for production...',
  '[10:41:09] ✓ 312 modules transformed',
  '[10:41:10] dist/index.html  0.92 kB',
  '[10:41:14] build complete in 8.41s',
]

const STATUS_PILL: Record<AgentStatus, { label: string; cls: string }> = {
  working: { label: 'In Progress', cls: 'bp-pill-blue' },
  success: { label: 'Done', cls: 'bp-pill-green' },
  warning: { label: 'Waiting', cls: 'bp-pill-orange' },
  idle: { label: 'Idle', cls: 'bp-pill-gray' },
}

function GhostIcon({ name }: { name: string }) {
  let body = null
  switch (name) {
    case 'plus':
      body = <path d="M12 5v14M5 12h14" />
      break
    case 'split':
      body = (
        <>
          <rect x={3} y={4} width={18} height={16} rx={2} />
          <path d="M12 4v16" />
        </>
      )
      break
    case 'trash':
      body = (
        <>
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 13h10l1-13" />
        </>
      )
      break
    case 'chevron-down':
      body = <path d="M6 9l6 6 6-6" />
      break
    case 'warning':
      body = (
        <>
          <path d="M12 3L2 20h20z" />
          <path d="M12 9v5" />
          <path d="M12 17.5v.1" />
        </>
      )
      break
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
  )
}

export function BottomPanel() {
  const logs = useStore((s) => s.logs)
  const bottomTab = useStore((s) => s.bottomTab)
  const setBottomTab = useStore((s) => s.setBottomTab)
  const problems = useStore((s) => s.problems)
  const selected = useStore((s) => s.selected)
  const agents = useStore((s) => s.agents)
  const selectAgent = useStore((s) => s.selectAgent)
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const agent = agents[selected]

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, bottomTab])

  return (
    <div className="bp-root">
      <div className="bp-tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`bp-tab${bottomTab === t.id ? ' bp-tab-active' : ''}`}
            onClick={() => setBottomTab(t.id)}
          >
            {t.label}
            {t.id === 'problems' && <span className="bp-count">{problems}</span>}
          </button>
        ))}
        <div className="bp-tools">
          <div className="bp-agentsel">
            <button className="bp-agentbtn" onClick={() => setMenuOpen((o) => !o)}>
              <span className="bp-agentdot" style={{ background: AGENT_CSS[selected] }} />
              {agent.name}
              <span className="bp-chev">
                <GhostIcon name="chevron-down" />
              </span>
            </button>
            {menuOpen && (
              <div className="bp-agentmenu">
                {AGENT_ORDER.map((id) => (
                  <button
                    key={id}
                    className="bp-agentitem"
                    onClick={() => {
                      selectAgent(id)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="bp-agentdot" style={{ background: AGENT_CSS[id] }} />
                    {agents[id].name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bp-ghost" aria-label="New terminal">
            <GhostIcon name="plus" />
          </button>
          <button className="bp-ghost" aria-label="Split">
            <GhostIcon name="split" />
          </button>
          <button className="bp-ghost" aria-label="Clear">
            <GhostIcon name="trash" />
          </button>
        </div>
      </div>
      <div className="bp-body">
        <div className="bp-log" ref={scrollRef}>
          {bottomTab === 'terminal' &&
            logs.map((l) => (
              <div key={l.id} className="bp-line">
                <span className="bp-time">{l.time}</span>
                <span style={{ color: AGENT_CSS[l.agent] }}>{`${l.agent}-agent`.padEnd(14)}</span>
                <span style={{ color: LEVEL_COLOR[l.level] }}>{`[${l.level}]`.padEnd(10)}</span>
                <span className="bp-msg">{l.message}</span>
              </div>
            ))}
          {bottomTab === 'output' &&
            OUTPUT_LINES.map((l, i) => (
              <div key={i} className="bp-line">
                <span className={l.includes('✓') ? 'bp-ok' : 'bp-msg'}>{l}</span>
              </div>
            ))}
          {bottomTab === 'eventlog' &&
            logs.map((l) => (
              <div key={l.id} className="bp-line bp-event">
                <span className="bp-time">{l.time}</span>
                <span className="bp-chip" style={{ color: LEVEL_COLOR[l.level] }}>
                  {l.level}
                </span>
                <span className="bp-msg">{l.message}</span>
              </div>
            ))}
          {bottomTab === 'problems' && (
            <>
              <div className="bp-problem">
                <span className="bp-warnicon">
                  <GhostIcon name="warning" />
                </span>
                <span className="bp-msg">unencrypted variable: DATABASE_URL</span>
                <span className="bp-fileref">environments/staging.env</span>
              </div>
              <div className="bp-problem">
                <span className="bp-warnicon">
                  <GhostIcon name="warning" />
                </span>
                <span className="bp-msg">deprecated rule: allow-all-agents</span>
                <span className="bp-fileref">configs/permissions.yaml</span>
              </div>
            </>
          )}
        </div>
        <div className="bp-task">
          <div className="bp-row">
            <span className="bp-label">Task</span>
            <span className="bp-value">{agent.task ?? '—'}</span>
          </div>
          <div className="bp-row">
            <span className="bp-label">Branch</span>
            <span className="bp-value bp-mono">{agent.branch ?? '—'}</span>
          </div>
          <div className="bp-row">
            <span className="bp-label">Status</span>
            <span className={`bp-pill ${STATUS_PILL[agent.status].cls}`}>{STATUS_PILL[agent.status].label}</span>
          </div>
          <div className="bp-row">
            <span className="bp-label">Progress</span>
            <span className="bp-progress">
              <span className="bp-track">
                <span className="bp-fill" style={{ width: `${agent.progress}%` }} />
              </span>
              <span className="bp-pct">{agent.progress}%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
