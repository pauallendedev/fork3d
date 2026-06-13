import { useState } from 'react'
import { useSimulation } from './state/store'
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
  useSimulation()
  const [rootPath] = useState<string | null>(null)
  const tree = useProjectTree(rootPath)
  return (
    <div className="app-root">
      <TitleBar />
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
