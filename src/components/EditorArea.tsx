import { useStore } from '../state/store'
import { OfficeScene } from '../scene/OfficeScene'
import { CommandPalette } from './CommandPalette'
import { EditorTabs } from './EditorTabs'
import { FileView } from './FileView'

export function EditorArea() {
  const openTabs = useStore((s) => s.openTabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const active = openTabs.find((t) => t.id === activeTabId) ?? openTabs[0]

  return (
    <div className="ea-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <EditorTabs />
      <div className="ea-body" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {active.kind === 'office' ? (
          <>
            <OfficeScene />
            <CommandPalette />
          </>
        ) : (
          <FileView path={active.path!} />
        )}
      </div>
    </div>
  )
}
