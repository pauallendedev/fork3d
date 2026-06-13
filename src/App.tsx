import { useState } from 'react'
import { useStore } from './state/store'
import { useForkcodeEvents } from './hooks/useForkcodeEvents'
import { useProjectTree } from './hooks/useProjectTree'
import { TitleBar } from './components/TitleBar'
import { CommandPalette } from './components/CommandPalette'
import { ActivityBar } from './components/ActivityBar'
import { StatusBar } from './components/StatusBar'
import { Explorer } from './components/Explorer'
import { SystemOverview } from './components/SystemOverview'
import { SecurityGatePanel } from './components/SecurityGatePanel'
import { BottomPanel } from './components/BottomPanel'
import { OfficeScene } from './scene/OfficeScene'
import './App.css'

export default function App() {
  useForkcodeEvents()
  const demo = useStore((s) => s.demo)
  const setDemo = useStore((s) => s.setDemo)
  const connected = useStore((s) => s.connected)
  const setConnected = useStore((s) => s.setConnected)
  const [rootPath, setRootPath] = useState<string | null>(null)
  const tree = useProjectTree(rootPath)

  async function openFolder() {
    const dir = await window.forkcode?.openFolder()
    if (dir) {
      setRootPath(dir)
      const ok = await window.forkcode?.isConnected(dir)
      setConnected(!!ok)
    }
  }

  async function connectProject() {
    if (!rootPath) return
    await window.forkcode?.connectProject(rootPath)
    setConnected(true)
  }

  return (
    <div className="app-root">
      <TitleBar
        onOpenFolder={window.forkcode ? openFolder : undefined}
        connected={connected}
        canConnect={!!rootPath}
        onConnect={window.forkcode ? connectProject : undefined}
        demo={demo}
        onToggleDemo={() => setDemo(!demo)}
      />
      <div className="app-main">
        <aside className="app-card app-activity">
          <ActivityBar />
        </aside>
        <aside className="app-card app-explorer">
          <Explorer rootName={tree.rootName} nodes={tree.nodes} />
        </aside>
        <div className="app-center">
          <section className="app-card app-scene-col">
            <OfficeScene />
            <CommandPalette />
          </section>
          <section className="app-card app-bottom">
            <BottomPanel />
          </section>
        </div>
        <div className="app-right">
          <section className="app-card app-overview">
            <SystemOverview />
          </section>
          <section className="app-card app-right-fill">
            <SecurityGatePanel />
          </section>
        </div>
      </div>
      <StatusBar />
    </div>
  )
}
