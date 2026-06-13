import type { CommandItem } from '../state/types'

export const COMMANDS: CommandItem[] = [
  { id: 'open-agent', title: 'Open Agent', subtitle: 'Activate an agent workspace', kbd: '⌘ O', icon: 'agent' },
  { id: 'run-workflow', title: 'Run Workflow', subtitle: 'Execute a workflow definition', kbd: '⌘ R', icon: 'flow' },
  { id: 'open-gate', title: 'Open Security Gate', subtitle: 'Review and approve staged changes', icon: 'shield' },
  { id: 'new-agent', title: 'Spawn New Agent', subtitle: 'Add an agent to the office', icon: 'plus' },
  { id: 'toggle-terminal', title: 'Toggle Terminal', subtitle: 'Show or hide the terminal panel', kbd: '⌘ J', icon: 'terminal' },
]
