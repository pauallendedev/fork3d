import { watch, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentEvent } from '../src/telemetry/types'

export type TranscriptRecord =
  | { kind: 'agent_use'; toolUseId: string; role: string; description: string }
  | { kind: 'tool_result'; toolUseId: string }
  | { kind: 'other' }

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

export function parseTranscriptLine(line: string): TranscriptRecord {
  let obj: unknown
  try {
    obj = JSON.parse(line)
  } catch {
    return { kind: 'other' }
  }
  const message = asRecord(asRecord(obj)?.message)
  const content = message?.content
  if (!Array.isArray(content)) return { kind: 'other' }
  for (const raw of content) {
    const block = asRecord(raw)
    if (!block) continue
    if (block.type === 'tool_use' && block.name === 'Agent') {
      const input = asRecord(block.input)
      return {
        kind: 'agent_use',
        toolUseId: String(block.id ?? ''),
        role: String(input?.subagent_type ?? 'general-purpose'),
        description: String(input?.description ?? ''),
      }
    }
    if (block.type === 'tool_result') {
      return { kind: 'tool_result', toolUseId: String(block.tool_use_id ?? '') }
    }
  }
  return { kind: 'other' }
}

/** Agent tool_uses with no matching tool_result = still running (backfill). */
export function runningAgentsFrom(lines: string[]): Array<{ toolUseId: string; role: string; description: string }> {
  const uses = new Map<string, { toolUseId: string; role: string; description: string }>()
  for (const line of lines) {
    const rec = parseTranscriptLine(line)
    if (rec.kind === 'agent_use') uses.set(rec.toolUseId, rec)
    else if (rec.kind === 'tool_result') uses.delete(rec.toolUseId)
  }
  return [...uses.values()]
}

/** Map a Claude project dir to its transcript folder under ~/.claude/projects. */
export function transcriptDirFor(projectRoot: string): string {
  const base = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
  // Claude encodes the project path by replacing slashes with dashes.
  const hash = projectRoot.replace(/\//g, '-')
  return join(base, 'projects', hash)
}

function latestJsonl(dir: string): string | null {
  let entries: string[]
  try {
    entries = readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
  } catch {
    return null
  }
  let best: { f: string; m: number } | null = null
  for (const f of entries) {
    const m = statSync(join(dir, f)).mtimeMs
    if (!best || m > best.m) best = { f, m }
  }
  return best ? join(dir, best.f) : null
}

export interface TailerOptions {
  projectRoot: string
  emit: (ev: AgentEvent) => void
}

/** Backfill running agents from the latest transcript, then watch for activity. */
export function startTailer(opts: TailerOptions): () => void {
  const dir = transcriptDirFor(opts.projectRoot)
  const file = latestJsonl(dir)
  if (!file) return () => {}

  // backfill: synthesize agent:start for still-running agents
  try {
    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
    for (const r of runningAgentsFrom(lines)) {
      opts.emit({ kind: 'agent:start', agentId: r.toolUseId, role: r.role, instructions: r.description, cwd: opts.projectRoot, sessionId: '', ts: Date.now() })
    }
  } catch {
    /* ignore */
  }

  // watch for appended lines → emit activity for tool_use blocks (best-effort)
  let size = (() => {
    try {
      return statSync(file).size
    } catch {
      return 0
    }
  })()
  const watcher = watch(file, () => {
    try {
      const stat = statSync(file)
      if (stat.size <= size) {
        size = stat.size
        return
      }
      const buf = readFileSync(file, 'utf8')
      const fresh = buf.slice(size).split('\n').filter(Boolean)
      size = stat.size
      for (const line of fresh) {
        const rec = parseTranscriptLine(line)
        if (rec.kind === 'agent_use') {
          opts.emit({ kind: 'agent:activity', agentId: rec.toolUseId, tool: 'Agent', summary: rec.description, cwd: opts.projectRoot, ts: Date.now() })
        }
      }
    } catch {
      /* ignore */
    }
  })
  return () => watcher.close()
}
