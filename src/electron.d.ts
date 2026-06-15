import type { AgentEvent } from './telemetry/types'

declare global {
  interface ForkcodeFsNode {
    name: string
    path: string
    type: 'folder' | 'file'
    children?: ForkcodeFsNode[]
  }

  interface Window {
    forkcode?: {
      openFolder(): Promise<string>
      readTree(root: string): Promise<ForkcodeFsNode[]>
      readFile(path: string): Promise<import('./state/types').FilePayload>
      onEvent(cb: (ev: AgentEvent) => void): () => void
      connectProject(root: string): Promise<{ ok: boolean; port: number }>
      isConnected(root: string): Promise<boolean>
    }
  }
}

export {}
