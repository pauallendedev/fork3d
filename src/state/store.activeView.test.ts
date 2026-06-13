import { expect, test } from 'vitest'
import { useStore } from './store'

test('activeView defaults to explorer and setActiveView changes it', () => {
  expect(useStore.getState().activeView).toBe('explorer')
  useStore.getState().setActiveView('search')
  expect(useStore.getState().activeView).toBe('search')
  useStore.getState().setActiveView('explorer') // reset for other tests
})
