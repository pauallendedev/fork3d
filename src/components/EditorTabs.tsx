import { useStore } from '../state/store'
import './EditorTabs.css'

export function EditorTabs() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const closeTab = useStore((s) => s.closeTab)

  return (
    <div className="et-bar" role="tablist">
      {openTabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          aria-selected={activeTabId === t.id}
          className={activeTabId === t.id ? 'et-tab et-tab--active' : 'et-tab'}
          onClick={() => setActiveTab(t.id)}
        >
          <span className="et-title">{t.title}</span>
          {t.kind === 'file' && (
            <button
              type="button"
              className="et-close"
              aria-label={`Close ${t.title}`}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(t.id)
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
