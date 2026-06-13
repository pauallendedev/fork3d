import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readTree } from './fs-tree'

let root: string

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forkcode-tree-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src', 'a.ts'), 'x')
  writeFileSync(join(root, 'README.md'), 'x')
  mkdirSync(join(root, 'node_modules'))
  writeFileSync(join(root, 'node_modules', 'junk.js'), 'x')
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('lists folders before files, ignores node_modules', () => {
  const tree = readTree(root)
  const names = tree.map((n) => n.name)
  expect(names).toEqual(['src', 'README.md'])
  expect(tree[0].type).toBe('folder')
  expect(tree[0].children?.map((c) => c.name)).toEqual(['a.ts'])
})

test('every node carries an absolute path', () => {
  const tree = readTree(root)
  expect(tree[0].path).toBe(join(root, 'src'))
})
