export type AgentColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'

export type AgentStatus = 'working' | 'success' | 'warning' | 'idle'

export type AgentPose = 'stand' | 'sit' | 'walk' | 'point'

export type AgentLocation = 'desk' | 'lounge' | 'whiteboard' | 'kanban' | 'gate' | 'floor'

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'IDLE'

export interface LogEntry {
  id: number
  time: string
  agent: AgentColor
  level: LogLevel
  message: string
}

export type BottomTab = 'terminal' | 'output' | 'eventlog' | 'problems'

export interface FileNode {
  name: string
  path?: string
  type: 'folder' | 'file'
  icon?: 'agent' | 'flow' | 'env' | 'spatial' | 'yaml' | 'md' | 'license'
  color?: AgentColor
  badge?: 'M' | 'U' | 'check' | 'dot'
  children?: FileNode[]
}

export interface CommandItem {
  id: string
  title: string
  subtitle: string
  kbd?: string
  icon: string
}

export interface GateAction {
  id: string
  title: string
  subtitle: string
  icon: string
}

export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm: string
}

export interface LiveAgent {
  id: string
  role: string
  color: AgentColor
  status: AgentStatus
  pose: AgentPose
  station: AgentLocation
  task: string | null
  activity: string | null
  startedAt: number
  endedAt?: number
}

export type ActiveView = 'explorer' | 'search' | 'scm' | 'spatial' | 'extensions'
