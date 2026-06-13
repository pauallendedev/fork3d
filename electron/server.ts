import { createServer, type Server } from 'node:http'

export interface ServerOptions {
  port: number
  onBody: (endpoint: string, body: unknown) => void
  onError?: (err: Error) => void
}

export function startServer(opts: ServerOptions): Server {
  const server = createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' }).end()
      return
    }
    req.on('error', () => {}) // swallow socket errors (e.g. after destroy)
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 5_000_000) req.destroy()
    })
    req.on('end', () => {
      if (req.destroyed) return
      let body: unknown
      try {
        body = data ? JSON.parse(data) : {}
      } catch {
        res.writeHead(204).end()
        return
      }
      try {
        opts.onBody(req.url ?? '', body)
      } catch (err) {
        console.error('[forkcode] onBody threw:', err)
      }
      res.writeHead(204).end()
    })
  })
  server.on('error', (err) => {
    if (opts.onError) {
      opts.onError(err)
    } else {
      console.error('[forkcode] telemetry server error:', err)
    }
  })
  server.listen(opts.port, '127.0.0.1')
  return server
}
