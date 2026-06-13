import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface FileNode {
  name: string
  path: string
  type: 'folder' | 'file'
  children?: FileNode[]
}

const IGNORE = new Set(['node_modules', '.git', 'dist', 'dist-electron', '.DS_Store', 'release'])

export function readTree(root: string, maxDepth = 7): FileNode[] {
  const walk = (dir: string, depth: number): FileNode[] => {
    if (depth > maxDepth) return []
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return []
    }
    const nodes: FileNode[] = []
    for (const name of entries) {
      if (IGNORE.has(name)) continue
      const full = join(dir, name)
      let stat
      try {
        stat = statSync(full)
      } catch {
        continue
      }
      const isDir = stat.isDirectory()
      nodes.push(
        isDir
          ? { name, path: full, type: 'folder', children: walk(full, depth + 1) }
          : { name, path: full, type: 'file' },
      )
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }
  return walk(root, 0)
}
