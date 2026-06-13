import type { AgentColor, LiveAgent, TodoItem } from './types'
import type { AgentEvent } from '../telemetry/types'
import { poseForRole, stationForRole } from '../telemetry/roles'

export interface AgentsSlice {
  agents: Record<string, LiveAgent>
  order: string[]
  todos: TodoItem[]
}

export const PALETTE: AgentColor[] = ['blue', 'green', 'orange', 'purple', 'red', 'yellow']

export function emptyAgentsSlice(): AgentsSlice {
  return { agents: {}, order: [], todos: [] }
}

export function applyEvent(slice: AgentsSlice, ev: AgentEvent): AgentsSlice {
  switch (ev.kind) {
    case 'agent:start': {
      if (slice.agents[ev.agentId]) return slice
      const color = PALETTE[slice.order.length % PALETTE.length]
      const agent: LiveAgent = {
        id: ev.agentId,
        role: ev.role,
        color,
        status: 'working',
        pose: poseForRole(ev.role),
        station: stationForRole(ev.role),
        task: ev.instructions,
        activity: null,
        startedAt: ev.ts,
      }
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: agent }, order: [...slice.order, ev.agentId] }
    }
    case 'agent:stop': {
      const a = slice.agents[ev.agentId]
      if (!a) return slice
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: { ...a, status: 'success', endedAt: ev.ts } } }
    }
    case 'agent:activity': {
      const a = slice.agents[ev.agentId]
      if (!a) return slice
      return { ...slice, agents: { ...slice.agents, [ev.agentId]: { ...a, activity: ev.summary } } }
    }
    case 'todos:update':
      return { ...slice, todos: ev.items }
  }
}

/** Remove agents that stopped more than graceMs ago. */
export function reapEnded(slice: AgentsSlice, now: number, graceMs: number): AgentsSlice {
  const ids = Object.keys(slice.agents)
  const survivors = ids.filter((id) => {
    const ended = slice.agents[id].endedAt
    return ended === undefined || now - ended < graceMs
  })
  if (survivors.length === ids.length) return slice
  const agents: Record<string, LiveAgent> = {}
  for (const id of survivors) agents[id] = slice.agents[id]
  return { ...slice, agents, order: slice.order.filter((id) => agents[id]) }
}
