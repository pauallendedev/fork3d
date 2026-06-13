import { expect, test } from 'vitest'
import { ping } from './smoke'

test('ping returns pong', () => {
  expect(ping()).toBe('pong')
})
