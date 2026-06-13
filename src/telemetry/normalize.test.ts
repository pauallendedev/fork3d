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

test('SubagentStop without agent_id is ignored', () => {
  expect(normalize('/agent/stop', { cwd: '/proj' }, NOW)).toBeNull()
})

test('null or non-object body never throws, returns null', () => {
  expect(normalize('/agent/start', null, NOW)).toBeNull()
  expect(normalize('/agent/start', undefined, NOW)).toBeNull()
  expect(normalize('/tool-use', 'not-an-object', NOW)).toBeNull()
})

test('malformed todo entries do not throw and are sanitized', () => {
  const ev = normalize('/tool-use', {
    cwd: '/p', session_id: 's',
    tool_input: { todos: [null, 42, { content: 'A', status: 'BOGUS', activeForm: 'Doing A' }] },
  }, NOW)
  expect(ev).not.toBeNull()
  // 3 entries map to 3 items; bad ones sanitized to empty strings + 'pending'
  expect(ev).toMatchObject({ kind: 'todos:update' })
  if (ev && ev.kind === 'todos:update') {
    expect(ev.items).toHaveLength(3)
    expect(ev.items[0]).toEqual({ content: '', status: 'pending', activeForm: '' })
    expect(ev.items[2].status).toBe('pending') // 'BOGUS' coerced
  }
})
