import { expect, test } from 'vitest'
import { parseTranscriptLine, runningAgentsFrom } from './transcript-tailer'

test('parses an Agent tool_use into a running-agent record', () => {
  const line = JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id: 'tu1', name: 'Agent', input: { subagent_type: 'Analista', description: 'review', prompt: 'do it' } }] },
  })
  const rec = parseTranscriptLine(line)
  expect(rec).toEqual({ kind: 'agent_use', toolUseId: 'tu1', role: 'Analista', description: 'review' })
})

test('parses a tool_result for correlation', () => {
  const line = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tu1' }] } })
  expect(parseTranscriptLine(line)).toEqual({ kind: 'tool_result', toolUseId: 'tu1' })
})

test('runningAgentsFrom returns Agent uses without a matching result', () => {
  const lines = [
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'a', name: 'Agent', input: { subagent_type: 'Tester', description: 'x' } }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'b', name: 'Agent', input: { subagent_type: 'Ingeniero', description: 'y' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'a' }] } }),
  ]
  const running = runningAgentsFrom(lines)
  expect(running.map((r) => r.toolUseId)).toEqual(['b'])
})
