import { expect, test } from 'vitest'
import { normalize } from './normalize'

const NOW = 1000

test('normalizes SubagentStart', () => {
  const ev = normalize('/agent/start', {
    agent_id: 'a1',
    agent_type: 'Desarrollador',
    subagent_instructions: 'Build the login form',
    cwd: '/proj',
    session_id: 's1',
  }, NOW)
  expect(ev).toEqual({
    kind: 'agent:start',
    agentId: 'a1',
    role: 'Desarrollador',
    instructions: 'Build the login form',
    cwd: '/proj',
    sessionId: 's1',
    ts: NOW,
  })
})

test('SubagentStart without agent_id is ignored', () => {
  expect(normalize('/agent/start', { agent_type: 'X' }, NOW)).toBeNull()
})

test('normalizes SubagentStop', () => {
  const ev = normalize('/agent/stop', { agent_id: 'a1', cwd: '/proj' }, NOW)
  expect(ev).toEqual({ kind: 'agent:stop', agentId: 'a1', cwd: '/proj', ts: NOW })
})

test('normalizes PostToolUse:TodoWrite', () => {
  const ev = normalize('/tool-use', {
    cwd: '/proj',
    session_id: 's1',
    tool_input: { todos: [{ content: 'A', status: 'in_progress', activeForm: 'Doing A' }] },
  }, NOW)
  expect(ev).toEqual({
    kind: 'todos:update',
    items: [{ content: 'A', status: 'in_progress', activeForm: 'Doing A' }],
    cwd: '/proj',
    sessionId: 's1',
    ts: NOW,
  })
})

test('unknown endpoint or malformed body is ignored', () => {
  expect(normalize('/nope', {}, NOW)).toBeNull()
  expect(normalize('/tool-use', { tool_input: {} }, NOW)).toBeNull()
})
