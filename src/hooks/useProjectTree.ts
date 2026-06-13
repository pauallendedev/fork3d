import { useEffect, useState } from 'react'
import type { FileNode } from '../state/types'
import { TREE, WORKSPACE_NAME } from '../data/workspace'

export interface ProjectTree {
  rootName: string
  nodes: FileNode[]
  isReal: boolean
}

const FALLBACK: ProjectTree = { rootName: WORKSPACE_NAME, nodes: TREE, isReal: false }

export function useProjectTree(rootPath: string | null): ProjectTree {
  const [tree, setTree] = useState<ProjectTree>(FALLBACK)

  useEffect(() => {
    const fc = window.forkcode
    if (!fc || !rootPath) return
    let cancelled = false
    fc.readTree(rootPath).then((nodes) => {
      if (cancelled) return
      const rootName = rootPath.split('/').filter(Boolean).pop() ?? rootPath
      setTree({ rootName, nodes: nodes as FileNode[], isReal: true })
    })
    return () => {
      cancelled = true
    }
  }, [rootPath])

  return tree
}
