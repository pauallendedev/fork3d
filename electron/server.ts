import { createServer, type Server } from 'node:http'

export interface ServerOptions {
  port: number
  onBody: (endpoint: string, body: unknown) => void
}

export function startServer(opts: ServerOptions): Server {
  const server = createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end()
      return
    }
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 5_000_000) req.destroy() // guard against runaway bodies
    })
    req.on('end', () => {
      try {
        const body = data ? JSON.parse(data) : {}
        opts.onBody(req.url ?? '', body)
      } catch {
        // ignore malformed payloads
      }
      res.writeHead(204).end()
    })
  })
  server.listen(opts.port, '127.0.0.1')
  return server
}
