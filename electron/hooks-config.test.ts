import { expect, test } from 'vitest'
import { hooksInstalled, installHooks, uninstallHooks, HookMatcherGroup, HookCommand } from './hooks-config'

test('install adds the three forkcode hooks', () => {
  const next = installHooks({}, 4517)
  expect(Object.keys(next.hooks!)).toEqual(expect.arrayContaining(['SubagentStart', 'SubagentStop', 'PostToolUse']))
  expect(hooksInstalled(next)).toBe(true)
  const cmd = next.hooks!.SubagentStart[0].hooks[0].command
  expect(cmd).toContain('127.0.0.1:4517/agent/start')
})

test('install is idempotent and preserves unrelated hooks', () => {
  const base = {
    hooks: {
      SubagentStart: [{ matcher: '', hooks: [{ type: 'command' as const, command: 'echo mine' }] }],
    },
  }
  const once = installHooks(base, 4517)
  const twice = installHooks(once, 4517)
  const cmds = twice.hooks!.SubagentStart.flatMap((g: HookMatcherGroup) => g.hooks.map((h: HookCommand) => h.command))
  expect(cmds.filter((c: string) => c === 'echo mine')).toHaveLength(1)
  expect(cmds.filter((c: string) => c.includes('/agent/start'))).toHaveLength(1)
})

test('uninstall removes only forkcode hooks', () => {
  const base = {
    hooks: { SubagentStart: [{ matcher: '', hooks: [{ type: 'command' as const, command: 'echo mine' }] }] },
  }
  const installed = installHooks(base, 4517)
  const removed = uninstallHooks(installed)
  expect(hooksInstalled(removed)).toBe(false)
  const cmds = removed.hooks!.SubagentStart.flatMap((g: HookMatcherGroup) => g.hooks.map((h: HookCommand) => h.command))
  expect(cmds).toEqual(['echo mine'])
})
