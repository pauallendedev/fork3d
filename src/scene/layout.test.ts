import { expect, test } from 'vitest'
import { STATION_ZONES, positionInZone } from './layout'

test('every station has a zone center', () => {
  for (const s of ['whiteboard', 'desk', 'gate', 'lounge', 'floor'] as const) {
    expect(STATION_ZONES[s]).toBeDefined()
  }
})

test('a single agent sits exactly at the zone center', () => {
  const c = STATION_ZONES.desk
  expect(positionInZone('desk', 0, 1)).toEqual(c)
})

test('multiple agents spread symmetrically around the center', () => {
  const c = STATION_ZONES.floor
  const left = positionInZone('floor', 0, 2)
  const right = positionInZone('floor', 1, 2)
  expect(left.x).toBeLessThan(c.x)
  expect(right.x).toBeGreaterThan(c.x)
})
