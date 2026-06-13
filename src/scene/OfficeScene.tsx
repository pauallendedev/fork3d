import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { VIEW_H, VIEW_W, at, wallLeft, wallRight } from './iso'
import { ANCHORS } from './layout'
import { Room } from './parts/Room'
import { Vault } from './parts/Vault'
import { Whiteboard } from './parts/Whiteboard'
import { KanbanWall } from './parts/KanbanWall'
import { SecurityGate } from './parts/SecurityGate'
import { Desk, DeskChair } from './parts/Desk'
import { Couch } from './parts/Couch'
import { Plant } from './parts/Plant'
import { AgentsLayer } from './parts/AgentsLayer'
import { RadialMenu } from './parts/RadialMenu'
import { SceneBadges } from './SceneBadges'
import './OfficeScene.css'

export function OfficeScene() {
  const zoom = useStore((s) => s.zoom)
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Size the stage to exactly the viewBox aspect so HTML overlays line up.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      const s = Math.min(r.width / VIEW_W, r.height / VIEW_H)
      setSize({ w: Math.round(VIEW_W * s), h: Math.round(VIEW_H * s) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="sc-root" ref={rootRef}>
      <div
        className="sc-stage"
        style={{
          width: size.w || undefined,
          height: size.h || undefined,
          transform: `scale(${zoom / 100})`,
        }}
      >
        <svg className="sc-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Room />
          <g transform={wallLeft(ANCHORS.vault)}>
            <g transform="translate(0 -26) scale(0.7)">
              <Vault />
            </g>
          </g>
          <g transform={wallRight(ANCHORS.whiteboard)}>
            <g transform="scale(1.25)">
              <Whiteboard />
            </g>
          </g>
          <g transform={wallRight(ANCHORS.kanban)}>
            <g transform="scale(1.1)">
              <KanbanWall />
            </g>
          </g>
          <g transform={at(ANCHORS.couch)}>
            <Couch />
          </g>
          <g transform={at(ANCHORS.plantA)}>
            <Plant />
          </g>
          <g transform={at(ANCHORS.plantB)}>
            <Plant />
          </g>
          <g transform={at(ANCHORS.plantC)}>
            <Plant />
          </g>
          {/* chair → bots → desk so the seated bot tucks between chair and monitors */}
          <g transform={at(ANCHORS.desk)}>
            <DeskChair />
          </g>
          <AgentsLayer />
          <g transform={at(ANCHORS.desk)}>
            <Desk />
          </g>
          <g transform={at(ANCHORS.gate)}>
            <SecurityGate />
          </g>
          <RadialMenu />
        </svg>
        <SceneBadges />
      </div>
    </div>
  )
}
