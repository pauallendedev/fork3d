import { expect, test } from 'vitest'
import { poseForRole, stationForRole } from './roles'

test('known roles map to their station and pose', () => {
  expect(stationForRole('Ingeniero')).toBe('whiteboard')
  expect(poseForRole('Ingeniero')).toBe('point')
  expect(stationForRole('Desarrollador')).toBe('desk')
  expect(poseForRole('Desarrollador')).toBe('sit')
  expect(stationForRole('Tester')).toBe('gate')
  expect(stationForRole('Analista')).toBe('lounge')
})

test('role matching is case-insensitive and tolerates suffixes', () => {
  expect(stationForRole('ingeniero (pensar)')).toBe('whiteboard')
})

test('unknown roles fall back to the floor', () => {
  expect(stationForRole('general-purpose')).toBe('floor')
  expect(poseForRole('general-purpose')).toBe('stand')
})
