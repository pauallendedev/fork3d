import type { LogLevel } from '../state/types'

export interface RadialSegment {
  id: string
  icon: 'plus-agent' | 'inbox' | 'branch' | 'refresh' | 'download' | 'copy' | 'lock' | 'gear'
  label: string
  active?: boolean
}

/** Order is clockwise starting at the top (12 o'clock) wedge. */
export const RADIAL_SEGMENTS: RadialSegment[] = [
  { id: 'spawn', icon: 'plus-agent', label: 'Spawn Agent' },
  { id: 'assign', icon: 'inbox', label: 'Assign Task' },
  { id: 'branch', icon: 'branch', label: 'Branch', active: true },
  { id: 'sync', icon: 'refresh', label: 'Sync' },
  { id: 'pull', icon: 'download', label: 'Pull Changes' },
  { id: 'duplicate', icon: 'copy', label: 'Duplicate' },
  { id: 'lock', icon: 'lock', label: 'Lock' },
  { id: 'settings', icon: 'gear', label: 'Settings' },
]

export const RADIAL_LOGS: Record<string, { level: LogLevel; message: string }> = {
  spawn: { level: 'SUCCESS', message: 'Spawned helper agent in sandbox' },
  assign: { level: 'INFO', message: 'Task assigned from backlog' },
  branch: { level: 'INFO', message: 'Created branch: feature/auth-flow-v2' },
  sync: { level: 'INFO', message: 'Synced workspace with origin' },
  pull: { level: 'SUCCESS', message: 'Pulled 7 commits from origin/main' },
  duplicate: { level: 'INFO', message: 'Duplicated agent configuration' },
  lock: { level: 'WARN', message: 'Workspace locked for exclusive access' },
  settings: { level: 'INFO', message: 'Opened agent settings' },
}
