import { useStore } from '../state/store'
import type { ProjectTree } from '../hooks/useProjectTree'
import { Explorer } from './Explorer'
import { SearchPanel } from './SearchPanel'
import { SourceControlPanel } from './SourceControlPanel'
import { ExtensionsPanel } from './ExtensionsPanel'
import './Sidebar.css'

export function Sidebar({ tree, onOpenFolder }: { tree: ProjectTree; onOpenFolder?: () => void }) {
  const activeView = useStore((s) => s.activeView)

  switch (activeView) {
    case 'explorer':
      return <Explorer rootName={tree.rootName} nodes={tree.nodes} isReal={tree.isReal} onOpenFolder={onOpenFolder} />
    case 'search':
      return <SearchPanel />
    case 'scm':
      return <SourceControlPanel />
    case 'extensions':
      return <ExtensionsPanel />
    case 'spatial':
      return (
        <div className="sb-placeholder">
          <span className="sb-ph-title">SPATIAL CAD</span>
          <p className="sb-ph-msg">The office is the editor. Scene controls — coming soon.</p>
        </div>
      )
  }
}
