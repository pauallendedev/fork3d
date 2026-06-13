import { useEffect, useRef } from 'react'
import { COMMANDS } from '../data/commands'
import { useStore } from '../state/store'
import './CommandPalette.css'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function SearchIcon() {
  return (
    <svg width={16} height={16} {...ICON_PROPS}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  )
}

/** Command icons keyed by CommandItem.icon. */
function CmdIcon({ name }: { name: string }) {
  switch (name) {
    case 'agent':
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <rect x="4.5" y="9" width="15" height="10.5" rx="2.5" />
          <path d="M12 9V5.5" />
          <circle cx="12" cy="4.3" r="1.2" />
          <path d="M9 13.5v2M15 13.5v2" />
        </svg>
      )
    case 'flow':
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
          <path d="M7 10.5V15a2 2 0 0 0 2 2h4.5" />
        </svg>
      )
    case 'shield':
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <path d="M12 3 4.5 5.8v5.4c0 4.7 3.2 8 7.5 9.3 4.3-1.3 7.5-4.6 7.5-9.3V5.8Z" />
          <path d="m9.2 11.6 2 2 3.6-3.7" />
        </svg>
      )
    case 'plus':
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <path d="M12 5.5v13" />
          <path d="M5.5 12h13" />
        </svg>
      )
    case 'terminal':
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <path d="m5.5 7.5 4.5 4.5-4.5 4.5" />
          <path d="M12.5 17.5h6" />
        </svg>
      )
    default:
      return (
        <svg width={15} height={15} {...ICON_PROPS}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
  }
}

function Keycaps({ kbd }: { kbd: string }) {
  return (
    <span className="cp-keys">
      {kbd.split(' ').map((key) => (
        <kbd key={key} className="cp-key">
          {key}
        </kbd>
      ))}
    </span>
  )
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen)
  const query = useStore((s) => s.paletteQuery)
  const setPalette = useStore((s) => s.setPalette)
  const setPaletteQuery = useStore((s) => s.setPaletteQuery)
  const runCommand = useStore((s) => s.runCommand)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global keyboard: ⌘K toggle, ⌘O run open-agent, Escape close.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const s = useStore.getState()
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        s.setPalette(!s.paletteOpen)
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        s.runCommand('open-agent')
      } else if (e.key === 'Escape') {
        s.setPalette(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus the input when the palette opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const q = query.trim().toLowerCase()
  // Mirror the mock: with an empty query only the top suggestion shows.
  const items = q ? COMMANDS.filter((c) => c.title.toLowerCase().includes(q)) : COMMANDS.slice(0, 1)

  return (
    <div className="cp-root">
      <div className="cp-bar">
        <span className="cp-search-icon">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          className="cp-input"
          type="text"
          value={query}
          placeholder="Type a command or search..."
          spellCheck={false}
          aria-label="Type a command or search..."
          onChange={(e) => {
            setPaletteQuery(e.target.value)
            if (!open) setPalette(true)
          }}
          onFocus={() => {
            if (!open) setPalette(true)
          }}
        />
        <span className="cp-keys">
          <kbd className="cp-key">⌘</kbd>
          <kbd className="cp-key">K</kbd>
        </span>
      </div>

      {open && (
        <div className="cp-list" role="listbox" aria-label="Commands">
          {items.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === 0}
              className={i === 0 ? 'cp-row cp-row--first' : 'cp-row'}
              onClick={() => runCommand(c.id)}
            >
              <span className="cp-tile">
                <CmdIcon name={c.icon} />
              </span>
              <span className="cp-meta">
                <span className="cp-title">{c.title}</span>
                <span className="cp-sub">{c.subtitle}</span>
              </span>
              {c.kbd && <Keycaps kbd={c.kbd} />}
            </button>
          ))}
          {items.length === 0 && <div className="cp-empty">No matching commands</div>}
        </div>
      )}
    </div>
  )
}
