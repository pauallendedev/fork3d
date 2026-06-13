import { iso } from './iso'
import type { Pt } from './iso'
import type { AgentColor } from '../state/types'

/** Wall height in screen pixels. */
export const WALL_H = 200

/** Anchor points for scene props (floor contact / wall base points). */
export const ANCHORS = {
  samsText: iso(0.16, 0),
  vault: iso(0.66, 0),
  whiteboard: iso(1, 0.24),
  kanban: iso(1, 0.64),
  gate: iso(0.64, 0.97),
  desk: iso(0.4, 0.54),
  couch: iso(0.17, 0.32),
  plantA: iso(0.05, 0.62),
  plantB: iso(0.05, 0.05),
  plantC: iso(0.95, 0.06),
} satisfies Record<string, Pt>

/** Where each agent stands/sits on the floor. */
export const AGENT_POS: Record<AgentColor, Pt> = {
  // blue sits at the near-left end of the desk: torso visible over the desktop
  blue: { x: 440, y: 432 },
  green: iso(0.84, 0.24),
  orange: iso(0.3, 0.78),
  purple: iso(0.86, 0.7),
  // red sits on the couch cushions
  red: { x: 352, y: 430 },
  yellow: iso(0.6, 0.84),
}

/** Offset of the radial menu center relative to the selected agent. */
export const RADIAL_OFFSET = { dx: 279, dy: -75 }

export interface BadgeDef {
  id: string
  title: string
  subtitle: string
  variant: 'light' | 'dark'
  /** CSS color of the small status dot, if any. */
  dot?: string
  /** Screen position inside the 1160×760 viewBox. */
  p: Pt
}

/** Floating location badges (HTML overlay, positioned with toPct). */
export const BADGES: BadgeDef[] = [
  { id: 'whiteboard', title: 'Whiteboard', subtitle: 'Ideas & Planning', variant: 'light', dot: 'var(--yellow)', p: { x: 603, y: 114 } },
  { id: 'kanban', title: 'Kanban Wall', subtitle: 'Work Items', variant: 'light', dot: 'var(--yellow)', p: { x: 905, y: 160 } },
  { id: 'vault', title: 'Vault', subtitle: 'Secure Storage', variant: 'dark', dot: 'var(--green)', p: { x: 197, y: 228 } },
  { id: 'lounge', title: 'Lounge', subtitle: 'Idle', variant: 'light', p: { x: 244, y: 418 } },
  { id: 'desk', title: 'Desk 01', subtitle: 'Active Compute', variant: 'dark', p: { x: 510, y: 555 } },
  { id: 'gate', title: 'Security Gate', subtitle: 'Access Granted', variant: 'light', dot: 'var(--green)', p: { x: 858, y: 486 } },
]
