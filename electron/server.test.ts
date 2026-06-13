import { afterEach, expect, test } from 'vitest'
import type { Server } from 'node:http'
import { startServer } from './server'

let server: Server | undefined
afterEach(() => server?.close())

function addrPort(s: Server): number {
  const a = s.address()
  if (a && typeof a === 'object') return a.port
  throw new Error('no port')
}

test('parses a POST body and reports endpoint + JSON', async () => {
  const received: Array<{ endpoint: string; body: unknown }> = []
  server = startServer({ port: 0, onBody: (endpoint, body) => received.push({ endpoint, body }) })
  await new Promise((r) => server!.on('listening', r))
  const port = addrPort(server)

  await fetch(`http://127.0.0.1:${port}/agent/start`, {
    method: 'POST',
    body: JSON.stringify({ agent_id: 'a1' }),
  })

  expect(received).toEqual([{ endpoint: '/agent/start', body: { agent_id: 'a1' } }])
})

test('malformed JSON does not call onBody and responds 204', async () => {
  let called = false
  server = startServer({ port: 0, onBody: () => { called = true } })
  await new Promise((r) => server!.on('listening', r))
  const port = addrPort(server)
  const res = await fetch(`http://127.0.0.1:${port}/x`, { method: 'POST', body: '{not json' })
  expect(res.status).toBe(204)
  expect(called).toBe(false)
})

test('onBody throwing is isolated and still responds 204', async () => {
  server = startServer({ port: 0, onBody: () => { throw new Error('boom') } })
  await new Promise((r) => server!.on('listening', r))
  const port = addrPort(server)
  const res = await fetch(`http://127.0.0.1:${port}/agent/start`, { method: 'POST', body: JSON.stringify({ agent_id: 'a1' }) })
  expect(res.status).toBe(204)
})
