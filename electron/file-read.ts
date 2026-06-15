import { readFileSync, statSync, realpathSync } from 'node:fs'
import { sep } from 'node:path'
import type { FilePayload } from '../src/state/types'

const MAX_BYTES = 1_000_000

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  json: 'json', jsonc: 'jsonc', css: 'css', scss: 'scss', less: 'less', html: 'html', htm: 'html',
  md: 'markdown', py: 'python', rs: 'rust', go: 'go', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash', sql: 'sql', toml: 'toml',
}

export function langForFile(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return 'text'
  const ext = name.slice(dot + 1).toLowerCase()
  return EXT_TO_LANG[ext] ?? 'text'
}

function canonical(p: string): string {
  try {
    return realpathSync(p)
  } catch {
    return p
  }
}

/** Read a file only if it resolves inside `root`; guard size + binary. Never throws. */
export function readFileGuarded(absPath: string, root: string): FilePayload {
  const empty: FilePayload = { content: '', lang: langForFile(absPath), truncated: false, binary: false }
  const realRoot = canonical(root)
  const real = canonical(absPath)
  if (realRoot && real !== realRoot && !real.startsWith(realRoot + sep)) return empty // outside root

  let size: number
  try {
    const st = statSync(real)
    if (!st.isFile()) return empty
    size = st.size
  } catch {
    return empty
  }
  if (size > MAX_BYTES) return { ...empty, truncated: true }

  let buf: Buffer
  try {
    buf = readFileSync(real)
  } catch {
    return empty
  }
  // binary detection: NUL byte in the first 8 KB
  const scan = buf.subarray(0, 8192)
  if (scan.includes(0)) return { ...empty, binary: true }

  return { content: buf.toString('utf8'), lang: langForFile(absPath), truncated: false, binary: false }
}
