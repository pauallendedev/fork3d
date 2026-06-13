import { useStore } from '../state/store'
import './StatusBar.css'

const ICON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function BranchIcon() {
  return (
    <svg {...ICON} width={13} height={13}>
      <path d="M6 3v12" />
      <circle cx={18} cy={6} r={3} />
      <circle cx={6} cy={18} r={3} />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg {...ICON} width={13} height={13} className="sb-sync-icon">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg {...ICON} width={13} height={13}>
      <circle cx={12} cy={12} r={9} />
      <path d="m5.6 18.4 12.8-12.8" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg {...ICON} width={13} height={13}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg {...ICON} width={13} height={13}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export function StatusBar() {
  const setBottomTab = useStore((s) => s.setBottomTab)

  return (
    <footer className="sb-root">
      <div className="sb-group">
        <button type="button" className="sb-pill">
          <BranchIcon />
          <span>main*</span>
        </button>
        <button type="button" className="sb-pill" aria-label="Synchronize changes">
          <SyncIcon />
        </button>
        <button type="button" className="sb-pill" aria-label="0 errors">
          <ErrorIcon />
          <span>0</span>
        </button>
        <button
          type="button"
          className="sb-pill"
          aria-label="2 warnings"
          onClick={() => setBottomTab('problems')}
        >
          <WarningIcon />
          <span>2</span>
        </button>
      </div>
      <div className="sb-group">
        <button type="button" className="sb-pill">Spaces: 2</button>
        <button type="button" className="sb-pill">UTF-8</button>
        <button type="button" className="sb-pill">LF</button>
        <button type="button" className="sb-pill">YAML</button>
        <button type="button" className="sb-pill">
          <span className="sb-dot" aria-hidden="true" />
          <span>SAMS: Connected</span>
        </button>
        <button type="button" className="sb-pill" aria-label="Notifications">
          <BellIcon />
        </button>
      </div>
    </footer>
  )
}
