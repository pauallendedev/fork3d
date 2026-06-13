import type { AgentEvent } from './types'
import type { TodoItem } from '../state/types'

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function normalize(endpoint: string, raw: unknown, now: number): AgentEvent | null {
  // Guard 1: null or non-object input — never throw on untrusted hook bodies
  if (raw == null || typeof raw !== 'object') return null
  const body = raw as Record<string, unknown>

  switch (endpoint) {
    case '/agent/start': {
      const id = body.agent_id
      if (typeof id !== 'string' || !id) return null
      return {
        kind: 'agent:start',
        agentId: id,
        role: str(body.agent_type, 'general-purpose'),
        instructions: typeof body.subagent_instructions === 'string' ? body.subagent_instructions : null,
        cwd: str(body.cwd),
        sessionId: str(body.session_id),
        ts: now,
      }
    }
    case '/agent/stop': {
      const id = body.agent_id
      if (typeof id !== 'string' || !id) return null
      return { kind: 'agent:stop', agentId: id, cwd: str(body.cwd), ts: now }
    }
    case '/tool-use': {
      const input = body.tool_input as { todos?: unknown } | undefined
      const todos = input?.todos
      if (!Array.isArray(todos) || todos.length === 0) return null
      const items: TodoItem[] = todos.map((t) => {
        // Guard 2: non-object todo entries default to empty record
        const todo = t != null && typeof t === 'object' ? (t as Record<string, unknown>) : {}
        // Guard 3: validate status against the allowed union
        const rawStatus = str(todo.status, 'pending')
        const status = (['pending', 'in_progress', 'completed'].includes(rawStatus) ? rawStatus : 'pending') as TodoItem['status']
        return {
          content: str(todo.content),
          status,
          activeForm: str(todo.activeForm),
        }
      })
      return { kind: 'todos:update', items, cwd: str(body.cwd), sessionId: str(body.session_id), ts: now }
    }
    default:
      return null
  }
}
