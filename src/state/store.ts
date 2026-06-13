import { create } from 'zustand'
import type { AgentColor, BottomTab, LiveAgent, LogEntry, LogLevel, TodoItem } from './types'
import { applyEvent as reduce, emptyAgentsSlice, reapEnded } from './reducer'
import type { AgentEvent } from '../telemetry/types'

export const AGENT_CSS: Record<AgentColor, string> = {
  blue: 'var(--agent-blue)',
  green: 'var(--agent-green)',
  orange: 'var(--agent-orange)',
  purple: 'var(--agent-purple)',
  red: 'var(--agent-red)',
  yellow: 'var(--agent-yellow)',
}

const REAP_GRACE_MS = 1500

function clock(): string {
  // Wall-clock HH:MM:SS for log stamps (renderer side; Date is fine here).
  return new Date().toTimeString().slice(0, 8)
}

let nextLogId = 1
function makeLog(agent: AgentColor, level: LogLevel, message: string): LogEntry {
  return { id: nextLogId++, time: clock(), agent, level, message }
}

interface ForkcodeStore {
  agents: Record<string, LiveAgent>
  order: string[]
  todos: TodoItem[]
  logs: LogEntry[]
  selected: string | null
  radialFor: string | null
  paletteOpen: boolean
  paletteQuery: string
  bottomTab: BottomTab
  zoom: number
  problems: number
  connected: boolean
  demo: boolean
  // actions
  applyEvent: (ev: AgentEvent) => void
  reap: () => void
  setConnected: (c: boolean) => void
  setDemo: (d: boolean) => void
  selectAgent: (id: string) => void
  setRadial: (id: string | null) => void
  setPalette: (open: boolean) => void
  setPaletteQuery: (q: string) => void
  setBottomTab: (t: BottomTab) => void
  setZoom: (z: number) => void
  pushLog: (agent: AgentColor, level: LogLevel, message: string) => void
  runGateAction: (id: string) => void
  runRadialAction: (id: string) => void
  runCommand: (id: string) => void
}

export const useStore = create<ForkcodeStore>((set, get) => ({
  ...emptyAgentsSlice(),
  logs: [],
  selected: null,
  radialFor: null,
  paletteOpen: true,
  paletteQuery: '',
  bottomTab: 'terminal',
  zoom: 100,
  problems: 2,
  connected: false,
  demo: false,

  applyEvent: (ev) =>
    set((s) => {
      const slice = reduce({ agents: s.agents, order: s.order, todos: s.todos }, ev)
      let logs = s.logs
      if (ev.kind === 'agent:start') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'INFO', `Spawned ${a.role}: ${a.task ?? '—'}`)]
      } else if (ev.kind === 'agent:stop') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'SUCCESS', `${a.role} finished`)]
      } else if (ev.kind === 'agent:activity') {
        const a = slice.agents[ev.agentId]
        if (a) logs = [...s.logs.slice(-200), makeLog(a.color, 'INFO', ev.summary)]
      }
      const selected = s.selected && slice.agents[s.selected] ? s.selected : (slice.order[0] ?? null)
      return { ...slice, logs, selected, radialFor: selected }
    }),

  reap: () => set((s) => reapEnded({ agents: s.agents, order: s.order, todos: s.todos }, Date.now(), REAP_GRACE_MS)),

  setConnected: (c) => set({ connected: c }),
  setDemo: (d) => set({ demo: d }),
  selectAgent: (id) => set({ selected: id, radialFor: id }),
  setRadial: (id) => set({ radialFor: id }),
  setPalette: (open) => set((s) => ({ paletteOpen: open, paletteQuery: open ? s.paletteQuery : '' })),
  setPaletteQuery: (q) => set({ paletteQuery: q }),
  setBottomTab: (t) => set({ bottomTab: t }),
  setZoom: (z) => set({ zoom: Math.min(140, Math.max(60, Math.round(z))) }),
  pushLog: (agent, level, message) => set((s) => ({ logs: [...s.logs.slice(-200), makeLog(agent, level, message)] })),

  runGateAction: () => {},
  runRadialAction: () => {},
  runCommand: (id) => {
    const s = get()
    s.setPalette(false)
    if (id === 'toggle-terminal') s.setBottomTab('terminal')
  },
}))
