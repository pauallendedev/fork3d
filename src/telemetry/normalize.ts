import type { AgentEvent, RawHookBody } from './types'
import type { TodoItem } from '../state/types'

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function normalize(endpoint: string, raw: RawHookBody, now: number): AgentEvent | null {
  switch (endpoint) {
    case '/agent/start': {
      const id = raw.agent_id
      if (typeof id !== 'string' || !id) return null
      return {
        kind: 'agent:start',
        agentId: id,
        role: str(raw.agent_type, 'general-purpose'),
        instructions: typeof raw.subagent_instructions === 'string' ? raw.subagent_instructions : null,
        cwd: str(raw.cwd),
        sessionId: str(raw.session_id),
        ts: now,
      }
    }
    case '/agent/stop': {
      const id = raw.agent_id
      if (typeof id !== 'string' || !id) return null
      return { kind: 'agent:stop', agentId: id, cwd: str(raw.cwd), ts: now }
    }
    case '/tool-use': {
      const input = raw.tool_input as { todos?: unknown } | undefined
      const todos = input?.todos
      if (!Array.isArray(todos) || todos.length === 0) return null
      const items: TodoItem[] = todos.map((t) => {
        const todo = t as Record<string, unknown>
        return {
          content: str(todo.content),
          status: (str(todo.status, 'pending') as TodoItem['status']),
          activeForm: str(todo.activeForm),
        }
      })
      return { kind: 'todos:update', items, cwd: str(raw.cwd), sessionId: str(raw.session_id), ts: now }
    }
    default:
      return null
  }
}
