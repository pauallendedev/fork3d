import type { ReactNode } from 'react'
import './ActivityBar.css'

const ICON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function FilesIcon() {
  return (
    <svg {...ICON} width={16} height={16}>
      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l5 5v8a2 2 0 0 1-2 2Z" />
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg {...ICON} width={16} height={16}>
      <circle cx={11} cy={11} r={7} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg {...ICON} width={16} height={16}>
      <path d="M6 3v12" />
      <circle cx={18} cy={6} r={3} />
      <circle cx={6} cy={18} r={3} />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}

function CubeIcon() {
  return (
    <svg {...ICON} width={16} height={16}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function SquaresIcon() {
  return (
    <svg {...ICON} width={16} height={16}>
      <rect x={3} y={3} width={7.5} height={7.5} rx={1.5} />
      <rect x={13.5} y={3} width={7.5} height={7.5} rx={1.5} />
      <rect x={3} y={13.5} width={7.5} height={7.5} rx={1.5} />
      <rect x={13.5} y={13.5} width={7.5} height={7.5} rx={1.5} />
    </svg>
  )
}

function RobotFace() {
  return (
    <svg {...ICON} width={16} height={16} stroke="#ffffff">
      <rect x={5.5} y={8.5} width={13} height={10} rx={3.2} />
      <path d="M12 8.5V5.6" />
      <circle cx={12} cy={4.2} r={1.2} />
      <circle cx={9.4} cy={13.5} r={1} fill="#ffffff" stroke="none" />
      <circle cx={14.6} cy={13.5} r={1} fill="#ffffff" stroke="none" />
    </svg>
  )
}

interface AbItem {
  label: string
  active?: boolean
  icon: ReactNode
}

const ITEMS: AbItem[] = [
  { label: 'Explorer', active: true, icon: <FilesIcon /> },
  { label: 'Search', icon: <SearchIcon /> },
  { label: 'Source Control', icon: <BranchIcon /> },
  { label: 'Spatial CAD', icon: <CubeIcon /> },
  { label: 'Extensions', icon: <SquaresIcon /> },
]

export function ActivityBar() {
  return (
    <nav className="ab-root" aria-label="Activity Bar">
      {ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.active ? 'ab-item ab-item--active' : 'ab-item'}
          aria-pressed={item.active ?? false}
        >
          <span className="ab-tile">{item.icon}</span>
          <span className="ab-label">{item.label}</span>
        </button>
      ))}
      <div className="ab-bottom">
        <div className="ab-avatar" aria-hidden="true">
          <RobotFace />
        </div>
        <span className="ab-online">Online</span>
      </div>
    </nav>
  )
}
