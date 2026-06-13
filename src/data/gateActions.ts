import type { GateAction, LogLevel } from '../state/types'

export const GATE_ACTIONS: GateAction[] = [
  { id: 'pr', title: 'Open Pull Request', subtitle: 'Create PR for staged changes', icon: 'pr' },
  { id: 'diff', title: 'Review Diff', subtitle: 'View changes and comments', icon: 'diff' },
  { id: 'commit', title: 'Commit All', subtitle: 'Stage and commit all changes', icon: 'commit' },
  { id: 'push', title: 'Push to Remote', subtitle: 'Push to origin/staging', icon: 'push' },
  { id: 'rules', title: 'Access Rules', subtitle: 'Manage gate permissions', icon: 'rules' },
  { id: 'merge', title: 'Merge Workflow', subtitle: 'Merge into main workflow', icon: 'merge' },
  { id: 'approve', title: 'Approve Gate', subtitle: 'Approve and deploy changes', icon: 'approve' },
  { id: 'duplicate', title: 'Duplicate', subtitle: 'Create a copy of this gate', icon: 'duplicate' },
]

export const GATE_LOGS: Record<string, { level: LogLevel; message: string }> = {
  pr: { level: 'INFO', message: 'Opened Pull Request #129: staging → main' },
  diff: { level: 'INFO', message: 'Reviewing diff: 14 files changed, +482 −97' },
  commit: { level: 'SUCCESS', message: 'Committed 14 files on feature/auth-flow' },
  push: { level: 'SUCCESS', message: 'Pushed 3 commits to origin/staging' },
  rules: { level: 'INFO', message: 'Opened access rules for security gate' },
  merge: { level: 'INFO', message: 'Merge queued: staging → main workflow' },
  approve: { level: 'SUCCESS', message: 'Gate approved — deploying to staging' },
  duplicate: { level: 'INFO', message: 'Duplicated gate: security-gate-copy' },
}
