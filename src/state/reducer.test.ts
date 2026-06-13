import { expect, test } from 'vitest'
import { applyEvent, emptyAgentsSlice, reapEnded } from './reducer'
import type { AgentStartEvent } from '../telemetry/types'

function start(id: string, role: string, ts = 1): AgentStartEvent {
  return { kind: 'agent:start', agentId: id, role, instructions: 't-' + id, cwd: '/p', sessionId: 's', ts }
}

test('agent:start spawns an agent with a station, pose, color', () => {
  const s = applyEvent(emptyAgentsSlice(), start('a1', 'Ingeniero'))
  expect(s.agents.a1.station).toBe('whiteboard')
  expect(s.agents.a1.pose).toBe('point')
  expect(s.agents.a1.status).toBe('working')
  expect(s.agents.a1.color).toBe('blue')
  expect(s.order).toEqual(['a1'])
})

test('colors cycle by arrival order and are stable', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, start('a2', 'Tester'))
  expect(s.agents.a1.color).toBe('blue')
  expect(s.agents.a2.color).toBe('green')
})

test('duplicate start is ignored (idempotent)', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, start('a1', 'Tester'))
  expect(s.order).toEqual(['a1'])
})

test('agent:stop marks success + endedAt but keeps the agent', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:stop', agentId: 'a1', cwd: '/p', ts: 5 })
  expect(s.agents.a1.status).toBe('success')
  expect(s.agents.a1.endedAt).toBe(5)
})

test('agent:activity updates the activity line', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:activity', agentId: 'a1', tool: 'Bash', summary: 'npm test', cwd: '/p', ts: 6 })
  expect(s.agents.a1.activity).toBe('npm test')
})

test('todos:update replaces the todo list', () => {
  const s = applyEvent(emptyAgentsSlice(), {
    kind: 'todos:update',
    items: [{ content: 'A', status: 'pending', activeForm: 'Doing A' }],
    cwd: '/p',
    sessionId: 's',
    ts: 7,
  })
  expect(s.todos).toHaveLength(1)
})

test('reapEnded drops agents whose grace window has elapsed', () => {
  let s = applyEvent(emptyAgentsSlice(), start('a1', 'Tester'))
  s = applyEvent(s, { kind: 'agent:stop', agentId: 'a1', cwd: '/p', ts: 100 })
  expect(Object.keys(reapEnded(s, 100 + 1400, 1500).agents)).toEqual(['a1'])
  expect(Object.keys(reapEnded(s, 100 + 1600, 1500).agents)).toEqual([])
})

test('applyEvent does not mutate the input slice', () => {
  const base = emptyAgentsSlice()
  const next = applyEvent(base, start('a1', 'Tester'))
  expect(base.agents).toEqual({})
  expect(base.order).toEqual([])
  expect(next).not.toBe(base)
})
