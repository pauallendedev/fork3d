import { useStore } from '../../state/store'
import type { AgentLocation, LiveAgent } from '../../state/types'
import { at } from '../iso'
import { positionInZone } from '../layout'
import { AgentBot } from './AgentBot'
import './AgentsLayer.css'

export function AgentsLayer() {
  const agents = useStore((s) => s.agents)
  const order = useStore((s) => s.order)
  const selected = useStore((s) => s.selected)
  const selectAgent = useStore((s) => s.selectAgent)

  // group by station to compute per-station cluster index
  const byStation: Record<string, LiveAgent[]> = {}
  for (const id of order) {
    const a = agents[id]
    if (!a) continue
    ;(byStation[a.station] ??= []).push(a)
  }

  const placed = order
    .map((id) => agents[id])
    .filter(Boolean)
    .map((a) => {
      const group = byStation[a.station]
      const idx = group.indexOf(a)
      const pos = positionInZone(a.station as AgentLocation, idx, group.length)
      return { a, pos }
    })
    .sort((p, q) => p.pos.y - q.pos.y)

  return (
    <g className="ag-layer">
      {placed.map(({ a, pos }, i) => (
        <g key={a.id} className={a.endedAt ? 'ag-spawn ag-leaving' : 'ag-spawn'} transform={at(pos)}>
          <AgentBot
            color={a.color}
            pose={a.pose}
            status={a.status}
            selected={selected === a.id}
            index={i}
            onClick={() => selectAgent(a.id)}
          />
        </g>
      ))}
    </g>
  )
}
