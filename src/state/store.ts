import { useEffect } from 'react'
import { create } from 'zustand'
import { GATE_LOGS } from '../data/gateActions'
import { RADIAL_LOGS } from '../data/radial'
import type { Agent, AgentColor, BottomTab, LogEntry, LogLevel } from './types'

export const AGENT_ORDER: AgentColor[] = ['blue', 'green', 'orange', 'purple', 'red', 'yellow']

/** CSS color per agent, for any component that needs to paint agent identity. */
export const AGENT_CSS: Record<AgentColor, string> = {
  blue: 'var(--agent-blue)',
  green: 'var(--agent-green)',
  orange: 'var(--agent-orange)',
  purple: 'var(--agent-purple)',
  red: 'var(--agent-red)',
  yellow: 'var(--agent-yellow)',
}

const TASKS: Record<AgentColor, string[]> = {
  blue: ['Implement authentication flow', 'Add OAuth providers', 'Harden session storage'],
  green: ['Run test suite', 'Add integration tests for /api/login', 'Raise coverage to 90%'],
  orange: ['Review Pull Request #128', 'Address review comments', 'Merge feature/billing'],
  purple: ['Update workflow: code-review.flow', 'Tune deploy.flow retries', 'Document onboarding.flow'],
  red: [],
  yellow: ['Deploy to staging environment', 'Verify staging smoke checks', 'Prepare production rollout'],
}

const initialAgents: Record<AgentColor, Agent> = {
  blue: { id: 'blue', name: 'blue-agent', status: 'working', pose: 'sit', location: 'desk', task: 'Implement authentication flow', branch: 'feature/auth-flow', progress: 72 },
  green: { id: 'green', name: 'green-agent', status: 'success', pose: 'point', location: 'whiteboard', task: 'Run test suite', branch: 'feature/test-suite', progress: 100 },
  orange: { id: 'orange', name: 'orange-agent', status: 'warning', pose: 'stand', location: 'floor', task: 'Review Pull Request #128', branch: 'feature/billing', progress: 48 },
  purple: { id: 'purple', name: 'purple-agent', status: 'working', pose: 'point', location: 'kanban', task: 'Update workflow: code-review.flow', branch: 'chore/workflows', progress: 35 },
  red: { id: 'red', name: 'red-agent', status: 'idle', pose: 'sit', location: 'lounge', task: null, branch: null, progress: 0 },
  yellow: { id: 'yellow', name: 'yellow-agent', status: 'success', pose: 'walk', location: 'gate', task: 'Deploy to staging environment', branch: 'release/staging', progress: 100 },
}

const initialLogs: LogEntry[] = [
  { id: 1, time: '10:42:11', agent: 'blue', level: 'INFO', message: 'Started task: Implement authentication flow' },
  { id: 2, time: '10:42:12', agent: 'green', level: 'SUCCESS', message: 'Tests passed: 24/24' },
  { id: 3, time: '10:42:13', agent: 'orange', level: 'WARN', message: 'Waiting for review: Pull Request #128' },
  { id: 4, time: '10:42:14', agent: 'purple', level: 'INFO', message: 'Updated workflow: code-review.flow' },
  { id: 5, time: '10:42:15', agent: 'yellow', level: 'SUCCESS', message: 'Deployed to staging environment' },
  { id: 6, time: '10:42:16', agent: 'red', level: 'IDLE', message: 'No active tasks' },
]

const SIM_POOL: Array<{ agent: AgentColor; level: LogLevel; message: string }> = [
  { agent: 'blue', level: 'INFO', message: 'Generated JWT middleware: src/auth/jwt.ts' },
  { agent: 'green', level: 'SUCCESS', message: 'Tests passed: 31/31' },
  { agent: 'purple', level: 'INFO', message: 'Workflow lint passed: 3 flows' },
  { agent: 'yellow', level: 'INFO', message: 'Smoke checks passed on staging' },
  { agent: 'orange', level: 'WARN', message: 'Still waiting for review: Pull Request #128' },
  { agent: 'blue', level: 'INFO', message: 'Refactored session store to Redis adapter' },
  { agent: 'red', level: 'IDLE', message: 'No active tasks' },
  { agent: 'green', level: 'INFO', message: 'Added integration tests for /api/login' },
  { agent: 'purple', level: 'SUCCESS', message: 'code-review.flow published to workspace' },
  { agent: 'yellow', level: 'SUCCESS', message: 'Staging environment healthy: 6/6 services' },
  { agent: 'blue', level: 'SUCCESS', message: 'Auth E2E suite passing: 12/12' },
  { agent: 'orange', level: 'INFO', message: 'Rebased feature/billing onto main' },
]

const START_CLOCK = 10 * 3600 + 42 * 60 + 17

function fmtClock(total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

let nextLogId = 100

interface ForkcodeStore {
  agents: Record<AgentColor, Agent>
  logs: LogEntry[]
  selected: AgentColor
  radialFor: AgentColor | null
  paletteOpen: boolean
  paletteQuery: string
  bottomTab: BottomTab
  zoom: number
  problems: number
  clock: number
  simIndex: number
  selectAgent: (id: AgentColor) => void
  setRadial: (id: AgentColor | null) => void
  setPalette: (open: boolean) => void
  setPaletteQuery: (q: string) => void
  setBottomTab: (t: BottomTab) => void
  setZoom: (z: number) => void
  pushLog: (agent: AgentColor, level: LogLevel, message: string) => void
  runGateAction: (id: string) => void
  runRadialAction: (id: string) => void
  runCommand: (id: string) => void
  tick: () => void
}

export const useStore = create<ForkcodeStore>((set, get) => ({
  agents: initialAgents,
  logs: initialLogs,
  selected: 'blue',
  radialFor: 'blue',
  paletteOpen: true,
  paletteQuery: '',
  bottomTab: 'terminal',
  zoom: 100,
  problems: 2,
  clock: START_CLOCK,
  simIndex: 0,

  selectAgent: (id) => set({ selected: id, radialFor: id }),
  setRadial: (id) => set({ radialFor: id }),
  setPalette: (open) => set((s) => ({ paletteOpen: open, paletteQuery: open ? s.paletteQuery : '' })),
  setPaletteQuery: (q) => set({ paletteQuery: q }),
  setBottomTab: (t) => set({ bottomTab: t }),
  setZoom: (z) => set({ zoom: Math.min(140, Math.max(60, Math.round(z))) }),

  pushLog: (agent, level, message) =>
    set((s) => ({
      logs: [...s.logs.slice(-200), { id: nextLogId++, time: fmtClock(s.clock), agent, level, message }],
    })),

  runGateAction: (id) => {
    const fx = GATE_LOGS[id]
    if (fx) get().pushLog('yellow', fx.level, fx.message)
  },

  runRadialAction: (id) => {
    const fx = RADIAL_LOGS[id]
    if (fx) get().pushLog(get().radialFor ?? get().selected, fx.level, fx.message)
  },

  runCommand: (id) => {
    const s = get()
    s.setPalette(false)
    if (id === 'open-agent') {
      s.selectAgent('blue')
      s.pushLog('blue', 'INFO', 'Agent workspace activated: blue-agent')
    } else if (id === 'run-workflow') {
      s.pushLog('purple', 'INFO', 'Running workflow: code-review.flow')
    } else if (id === 'open-gate') {
      s.pushLog('yellow', 'INFO', 'Security gate opened: staging environment')
    } else if (id === 'new-agent') {
      s.pushLog('green', 'SUCCESS', 'Spawned new agent: teal-agent (sandbox)')
    } else if (id === 'toggle-terminal') {
      s.setBottomTab('terminal')
    }
  },

  tick: () =>
    set((s) => {
      const clock = s.clock + 1
      const stamp = fmtClock(clock)
      const agents = { ...s.agents }
      let logs = s.logs
      const push = (agent: AgentColor, level: LogLevel, message: string) => {
        logs = [...logs.slice(-200), { id: nextLogId++, time: stamp, agent, level, message }]
      }

      for (const id of AGENT_ORDER) {
        const a = agents[id]
        if (a.status !== 'working' || !a.task) continue
        const progress = Math.min(100, a.progress + (Math.random() < 0.55 ? Math.ceil(Math.random() * 2) : 0))
        if (progress >= 100) {
          push(id, 'SUCCESS', `Completed task: ${a.task}`)
          const list = TASKS[id]
          const next = list.length ? list[(list.indexOf(a.task) + 1) % list.length] : null
          agents[id] = { ...a, progress: 4, task: next }
          if (next) push(id, 'INFO', `Started task: ${next}`)
        } else {
          agents[id] = { ...a, progress }
        }
      }

      let simIndex = s.simIndex
      if (clock % 6 === 0) {
        const entry = SIM_POOL[simIndex % SIM_POOL.length]
        simIndex++
        push(entry.agent, entry.level, entry.message)
      }

      return { clock, agents, logs, simIndex }
    }),
}))

/** Mount once (e.g. in App) to drive the office simulation. */
export function useSimulation() {
  const tick = useStore((s) => s.tick)
  useEffect(() => {
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [tick])
}
