import './TitleBar.css'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Tiny white robot glyph for the accent logo tile. */
function RobotGlyph() {
  return (
    <svg width={15} height={15} {...ICON_PROPS}>
      <circle cx="12" cy="12.5" r="6.5" />
      <path d="M12 6V3.5" />
      <circle cx="12" cy="2.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.7" cy="11.8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="11.8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PanelsIcon() {
  return (
    <svg width={16} height={16} {...ICON_PROPS}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
      <path d="M9.5 12h11" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg width={16} height={16} {...ICON_PROPS}>
      <path d="M21 12.5h-5l-1.6 2.5h-4.8L8 12.5H3" />
      <path d="M6.2 5.6 3 12.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5.5l-3.2-6.9A2 2 0 0 0 16 4.5H8a2 2 0 0 0-1.8 1.1Z" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width={16} height={16} {...ICON_PROPS}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width={16} height={16} {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

interface TitleBarProps {
  onOpenFolder?: () => void
  demo?: boolean
  onToggleDemo?: () => void
}

function FolderIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

export function TitleBar({ onOpenFolder, demo, onToggleDemo }: TitleBarProps) {
  return (
    <header className="tb-root">
      <div className="tb-lights" aria-hidden="true">
        <span className="tb-light tb-light--close" />
        <span className="tb-light tb-light--min" />
        <span className="tb-light tb-light--max" />
      </div>

      <div className="tb-brand">
        <span className="tb-logo">
          <RobotGlyph />
        </span>
        <span className="tb-name">SAMS</span>
        <span className="tb-divider" />
        <span className="tb-sub">Spatial Agentic Management System</span>
      </div>

      <div className="tb-actions">
        {onOpenFolder && (
          <button className="tb-btn" type="button" aria-label="Open folder" onClick={onOpenFolder}>
            <FolderIcon />
          </button>
        )}
        {onToggleDemo && (
          <button type="button" className="tb-btn" aria-pressed={demo} aria-label="Toggle demo office" onClick={onToggleDemo}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={demo ? 'var(--accent)' : 'currentColor'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={9} /><path d="M10 9l5 3-5 3z" />
            </svg>
          </button>
        )}
        <button className="tb-btn" type="button" aria-label="Toggle panels">
          <PanelsIcon />
        </button>
        <button className="tb-btn" type="button" aria-label="Inbox">
          <InboxIcon />
        </button>
        <button className="tb-btn" type="button" aria-label="Cloud sync">
          <CloudIcon />
        </button>
        <button className="tb-btn" type="button" aria-label="Apps">
          <GridIcon />
        </button>
      </div>
    </header>
  )
}
