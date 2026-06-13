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
    }
  }
}

export {}
