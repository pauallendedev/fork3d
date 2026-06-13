/**
 * Shared 2:1 isometric helpers. EVERY scene component must use these so the
 * whole office shares one projection.
 *
 * Floor coordinate system: iso(u, v) with u, v in [0, 1].
 *   u axis runs from the LEFT corner toward the TOP (back-left direction).
 *   v axis runs from the LEFT corner toward the BOTTOM (front-right direction).
 *   Corners: L = iso(0,0) → (150, 425) · T = iso(1,0) → (580, 210)
 *            R = iso(1,1) → (1010, 425) · B = iso(0,1) → (580, 640)
 *   h is height above the floor in screen pixels.
 */
export const VIEW_W = 1160
export const VIEW_H = 760

/** Unit direction components for 2:1 iso edges. */
export const RX = 0.894
export const RY = 0.447

export interface Pt {
  x: number
  y: number
}

export function iso(u: number, v: number, h = 0): Pt {
  return { x: 150 + (u + v) * 430, y: 425 + (v - u) * 215 - h }
}

/** SVG transform that translates to a point (with optional pixel offset). */
export function at(p: Pt, dx = 0, dy = 0): string {
  return `translate(${(p.x + dx).toFixed(1)} ${(p.y + dy).toFixed(1)})`
}

/** Convert a scene point to percentage offsets for HTML overlays. */
export function toPct(p: Pt): { left: string; top: string } {
  return {
    left: `${((p.x / VIEW_W) * 100).toFixed(2)}%`,
    top: `${((p.y / VIEW_H) * 100).toFixed(2)}%`,
  }
}

/**
 * Wall plane transforms. Draw flat 2D artwork where local +x runs along the
 * wall, local -y is up, and (0,0) sits at the artwork's base point on the
 * floor line; then wrap it in <g transform={wallLeft(anchor)}>.
 */
export function wallLeft(p: Pt): string {
  return `matrix(${RX} ${-RY} 0 1 ${p.x.toFixed(1)} ${p.y.toFixed(1)})`
}

export function wallRight(p: Pt): string {
  return `matrix(${RX} ${RY} 0 1 ${p.x.toFixed(1)} ${p.y.toFixed(1)})`
}

/**
 * Local iso point maker for drawing prop geometry around a local origin.
 * a = distance along the front-right direction, b = along the front-left
 * direction, dy = height. Returns "x,y" for use inside <polygon points>.
 */
export function p2(a: number, b: number, dy = 0): string {
  return `${(RX * (a - b)).toFixed(1)},${(RY * (a + b) - dy).toFixed(1)}`
}

/** A simple 3-face iso box centered on the local origin (origin = base center). */
export function IsoBox({
  w,
  d,
  h,
  top = 'var(--iso-top)',
  left = 'var(--iso-left)',
  right = 'var(--iso-right)',
}: {
  w: number
  d: number
  h: number
  top?: string
  left?: string
  right?: string
}) {
  const hw = w / 2
  const hd = d / 2
  return (
    <g>
      <polygon points={`${p2(hw, -hd, h)} ${p2(hw, hd, h)} ${p2(-hw, hd, h)} ${p2(-hw, -hd, h)}`} fill={top} />
      <polygon points={`${p2(-hw, hd, h)} ${p2(hw, hd, h)} ${p2(hw, hd)} ${p2(-hw, hd)}`} fill={left} />
      <polygon points={`${p2(hw, hd, h)} ${p2(hw, -hd, h)} ${p2(hw, -hd)} ${p2(hw, hd)}`} fill={right} />
    </g>
  )
}

/** Soft elliptical contact shadow, centered on local origin. */
export function GroundShadow({ w = 120, opacity = 0.1 }: { w?: number; opacity?: number }) {
  return <ellipse cx={0} cy={0} rx={w / 2} ry={w * 0.16} fill={`rgba(31, 41, 55, ${opacity})`} />
}
