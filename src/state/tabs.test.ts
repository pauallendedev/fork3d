import { beforeEach, expect, test } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  // reset tabs before each test
  useStore.setState({ openTabs: [{ id: 'office', kind: 'office', title: 'Office' }], activeTabId: 'office' })
})

test('office tab exists by default and is active', () => {
  const s = useStore.getState()
  expect(s.openTabs).toEqual([{ id: 'office', kind: 'office', title: 'Office' }])
  expect(s.activeTabId).toBe('office')
})

test('openFileTab adds a file tab and activates it; re-opening just activates', () => {
  useStore.getState().openFileTab('/p/a.ts', 'a.ts')
  let s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts'])
  expect(s.activeTabId).toBe('/p/a.ts')

  useStore.getState().setActiveTab('office')
  useStore.getState().openFileTab('/p/a.ts', 'a.ts') // already open
  s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts']) // no duplicate
  expect(s.activeTabId).toBe('/p/a.ts')
})

test('closeTab removes a file tab; closing the active one activates a neighbor; office never closes', () => {
  useStore.getState().openFileTab('/p/a.ts', 'a.ts')
  useStore.getState().openFileTab('/p/b.ts', 'b.ts')
  useStore.getState().closeTab('/p/b.ts') // was active
  let s = useStore.getState()
  expect(s.openTabs.map((t) => t.id)).toEqual(['office', '/p/a.ts'])
  expect(s.activeTabId).toBe('/p/a.ts')

  useStore.getState().closeTab('office') // pinned — no-op
  s = useStore.getState()
  expect(s.openTabs.some((t) => t.id === 'office')).toBe(true)
})
