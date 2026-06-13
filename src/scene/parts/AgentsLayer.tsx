import { AGENT_ORDER, useStore } from '../../state/store'
import { at } from '../iso'
import { AGENT_POS } from '../layout'
import { AgentBot } from './AgentBot'
import './AgentsLayer.css'

/** Painter order: bots sorted by screen y ascending (back → front). */
const SORTED = [...AGENT_ORDER].sort((a, b) => AGENT_POS[a].y - AGENT_POS[b].y)

export function AgentsLayer() {
  const agents = useStore((s) => s.agents)
  const selected = useStore((s) => s.selected)
  const selectAgent = useStore((s) => s.selectAgent)

  return (
    <g className="ag-layer">
      {SORTED.map((id) => {
        const agent = agents[id]
        return (
          <g key={id} transform={at(AGENT_POS[id])}>
            <AgentBot
              color={id}
              pose={agent.pose}
              status={agent.status}
              selected={selected === id}
              index={AGENT_ORDER.indexOf(id)}
              onClick={() => selectAgent(id)}
            />
          </g>
        )
      })}
    </g>
  )
}
