import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { langForFile, readFileGuarded } from './file-read'

let root: string
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forkcode-read-'))
  writeFileSync(join(root, 'a.ts'), 'const x: number = 1\n')
  writeFileSync(join(root, 'big.txt'), 'x'.repeat(1_200_000))
  writeFileSync(join(root, 'bin.dat'), Buffer.from([1, 2, 0, 3, 4]))
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('langForFile maps extensions and falls back to text', () => {
  expect(langForFile('a.ts')).toBe('typescript')
  expect(langForFile('x.unknownext')).toBe('text')
  expect(langForFile('Makefile')).toBe('text')
})

test('reads a normal text file with detected lang', () => {
  const p = readFileGuarded(join(root, 'a.ts'), root)
  expect(p.binary).toBe(false)
  expect(p.truncated).toBe(false)
  expect(p.lang).toBe('typescript')
  expect(p.content).toContain('const x')
})

test('flags oversize files as truncated (no content)', () => {
  const p = readFileGuarded(join(root, 'big.txt'), root)
  expect(p.truncated).toBe(true)
  expect(p.content).toBe('')
})

test('flags binary files (no content)', () => {
  const p = readFileGuarded(join(root, 'bin.dat'), root)
  expect(p.binary).toBe(true)
  expect(p.content).toBe('')
})

test('rejects paths outside the root', () => {
  const p = readFileGuarded(join(root, '..', 'etc-passwd-ish'), root)
  expect(p.content).toBe('')
  expect(p.binary).toBe(false)
  expect(p.truncated).toBe(false)
})

test('rejects a symlink inside root that points outside root', () => {
  const outside = mkdtempSync(join(tmpdir(), 'forkcode-outside-'))
  writeFileSync(join(outside, 'secret.txt'), 'TOP SECRET')
  const link = join(root, 'escape')
  try {
    symlinkSync(join(outside, 'secret.txt'), link)
  } catch {
    return // symlink not permitted in this env; skip
  }
  const p = readFileGuarded(link, root)
  expect(p.content).toBe('')
  rmSync(outside, { recursive: true, force: true })
})
