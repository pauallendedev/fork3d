import type { AgentLocation, AgentPose } from '../state/types'

export interface RoleConfig {
  station: AgentLocation
  pose: AgentPose
}

export const DEFAULT_ROLE_MAP: Record<string, RoleConfig> = {
  Ingeniero: { station: 'whiteboard', pose: 'point' },
  Desarrollador: { station: 'desk', pose: 'sit' },
  Tester: { station: 'gate', pose: 'stand' },
  Analista: { station: 'lounge', pose: 'sit' },
}

const FALLBACK: RoleConfig = { station: 'floor', pose: 'stand' }

function lookup(role: string): RoleConfig {
  const lower = role.toLowerCase()
  const key = Object.keys(DEFAULT_ROLE_MAP).find((k) => lower.startsWith(k.toLowerCase()))
  return key ? DEFAULT_ROLE_MAP[key] : FALLBACK
}

export function stationForRole(role: string): AgentLocation {
  return lookup(role).station
}
export function poseForRole(role: string): AgentPose {
  return lookup(role).pose
}
