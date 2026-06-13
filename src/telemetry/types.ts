import type { TodoItem } from '../state/types'

export interface AgentStartEvent {
  kind: 'agent:start'
  agentId: string
  role: string
  instructions: string | null
  cwd: string
  sessionId: string
  ts: number
}
export interface AgentStopEvent {
  kind: 'agent:stop'
  agentId: string
  cwd: string
  ts: number
}
export interface AgentActivityEvent {
  kind: 'agent:activity'
  agentId: string
  tool: string
  summary: string
  cwd: string
  ts: number
}
export interface TodosEvent {
  kind: 'todos:update'
  items: TodoItem[]
  cwd: string
  sessionId: string
  ts: number
}

export type AgentEvent = AgentStartEvent | AgentStopEvent | AgentActivityEvent | TodosEvent

/** Loosely-typed JSON body as received from a hook POST. */
export type RawHookBody = Record<string, unknown>
