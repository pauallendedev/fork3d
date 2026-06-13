export interface HookCommand {
  type: 'command'
  command: string
  timeout?: number
}
export interface HookMatcherGroup {
  matcher?: string
  hooks: HookCommand[]
}
export type HooksMap = Record<string, HookMatcherGroup[]>
export interface Settings {
  hooks?: HooksMap
  [k: string]: unknown
}

const PATHS = ['/agent/start', '/agent/stop', '/tool-use']

function isForkcodeGroup(group: HookMatcherGroup): boolean {
  return (group.hooks ?? []).some(
    (h) => typeof h.command === 'string' && h.command.includes('127.0.0.1') && PATHS.some((p) => h.command.includes(p)),
  )
}

export function forkcodeHooks(port: number): HooksMap {
  const post = (path: string): HookCommand => ({
    type: 'command',
    command: `curl -s -X POST -d @- http://127.0.0.1:${port}${path}`,
    timeout: 10,
  })
  return {
    SubagentStart: [{ matcher: '', hooks: [post('/agent/start')] }],
    SubagentStop: [{ matcher: '', hooks: [post('/agent/stop')] }],
    PostToolUse: [{ matcher: 'TodoWrite', hooks: [post('/tool-use')] }],
  }
}

export function installHooks(settings: Settings, port: number): Settings {
  const next: Settings = { ...settings }
  const hooks: HooksMap = { ...(next.hooks ?? {}) }
  const fc = forkcodeHooks(port)
  for (const [event, groups] of Object.entries(fc)) {
    const kept = (hooks[event] ?? []).filter((g) => !isForkcodeGroup(g))
    hooks[event] = [...kept, ...groups]
  }
  next.hooks = hooks
  return next
}

export function uninstallHooks(settings: Settings): Settings {
  const next: Settings = { ...settings }
  const hooks: HooksMap = { ...(next.hooks ?? {}) }
  for (const event of Object.keys(hooks)) {
    hooks[event] = hooks[event].filter((g) => !isForkcodeGroup(g))
    if (hooks[event].length === 0) delete hooks[event]
  }
  next.hooks = hooks
  return next
}

export function hooksInstalled(settings: Settings): boolean {
  const hooks = settings.hooks ?? {}
  return Object.values(hooks).some((groups) => groups.some(isForkcodeGroup))
}
