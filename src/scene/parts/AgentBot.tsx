import type { CSSProperties } from 'react'
import type { AgentColor, AgentPose, AgentStatus } from '../../state/types'
import { AGENT_CSS } from '../../state/store'
import { GroundShadow } from '../iso'

/** Status → floating dot color (§10). */
const STATUS_CSS: Record<AgentStatus, string> = {
  working: 'var(--accent)',
  success: 'var(--green)',
  warning: 'var(--orange)',
  idle: 'var(--text-3)',
}

/** Arm rotation (degrees, about the shoulder) per pose: [left, right]. */
const ARM_ROT: Record<AgentPose, [number, number]> = {
  stand: [0, 0],
  sit: [0, 0],
  walk: [18, -18],
  point: [0, -130], // raised 40° above horizontal, toward the wall behind
}

/** Stubby arm: rounded rect 9×20 r 4.5, agent color slightly darkened. */
function Arm({ x, rotate, fill }: { x: number; rotate: number; fill: string }) {
  return (
    <g transform={rotate ? `rotate(${rotate} ${x} -41.5)` : undefined}>
      <rect x={x - 4.5} y={-44} width={9} height={20} rx={4.5} fill={fill} />
      <rect x={x - 4.5} y={-44} width={9} height={20} rx={4.5} fill="var(--ink-deep)" opacity={0.14} />
    </g>
  )
}

/** Small bent leg for the sit pose: angled rounded rect + dark foot cap. */
function Leg({ x, rotate, fill }: { x: number; rotate: number; fill: string }) {
  return (
    <g transform={`translate(${x} -16) rotate(${rotate})`}>
      <rect x={-4.5} y={0} width={9} height={12} rx={4.5} fill={fill} />
      <rect x={-4.5} y={0} width={9} height={12} rx={4.5} fill="var(--ink-deep)" opacity={0.14} />
      <ellipse cx={0} cy={12.5} rx={5} ry={2.8} fill="var(--ink-deep)" />
    </g>
  )
}

/**
 * Cute chibi robot, billboard style in screen space (no iso skew).
 * Local origin = feet center; the bot is drawn upward in negative y (~76px tall).
 * The parent applies the positioning transform.
 */
export function AgentBot({
  color,
  pose,
  status,
  selected = false,
  index = 0,
  onClick,
}: {
  color: AgentColor
  pose: AgentPose
  status: AgentStatus
  selected?: boolean
  index?: number
  onClick?: () => void
}) {
  const fill = AGENT_CSS[color]
  const sit = pose === 'sit'
  const walk = pose === 'walk'
  const bodyDy = sit ? 10 : 0
  const clipId = `ag-bodyclip-${color}`
  const [leftRot, rightRot] = ARM_ROT[pose]
  const vars = { '--ag-i': index } as CSSProperties

  return (
    <g className={selected ? 'ag-bot ag-selected' : 'ag-bot'} style={vars} onClick={onClick}>
      <defs>
        <clipPath id={clipId}>
          <rect x={-22} y={-62} width={44} height={54} rx={21} />
        </clipPath>
      </defs>

      {/* contact shadow + dashed selection ring stay grounded (outside the bob) */}
      <GroundShadow w={54} />
      {selected && (
        <ellipse
          className="ag-ring"
          cx={0}
          cy={0}
          rx={34}
          ry={12}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}

      <g className="ag-lift">
        {/* idle bob lives on this INNER group so it composes with positioning */}
        <g className="ag-bob">
          <g className={walk ? 'ag-sway' : undefined} transform={bodyDy ? `translate(0 ${bodyDy})` : undefined}>
            {/* feet (hidden when sitting; one foot forward when walking) */}
            {!sit &&
              (walk ? (
                <>
                  <ellipse cx={-11} cy={-1.5} rx={6} ry={3} fill="var(--ink-deep)" />
                  <ellipse cx={8} cy={-4.5} rx={6} ry={3} fill="var(--ink-deep)" />
                </>
              ) : (
                <>
                  <ellipse cx={-10} cy={-3} rx={6} ry={3} fill="var(--ink-deep)" />
                  <ellipse cx={10} cy={-3} rx={6} ry={3} fill="var(--ink-deep)" />
                </>
              ))}

            {/* small bent legs in front when sitting */}
            {sit && (
              <>
                <Leg x={-8} rotate={20} fill={fill} />
                <Leg x={8} rotate={-20} fill={fill} />
              </>
            )}

            {/* stubby arms, tucked behind the body */}
            <Arm x={-25} rotate={leftRot} fill={fill} />
            <Arm x={25} rotate={rightRot} fill={fill} />

            {/* capsule body with bottom shade + soft sheen */}
            <rect x={-22} y={-62} width={44} height={54} rx={21} fill={fill} />
            <g clipPath={`url(#${clipId})`}>
              <ellipse cx={0} cy={-10} rx={24} ry={16} fill="var(--ink-deep)" opacity={0.08} />
              <ellipse cx={-9} cy={-52} rx={8} ry={11} fill="#ffffff" opacity={0.16} />
            </g>

            {/* dark visor with two blinking white eyes */}
            <rect x={-14} y={-56} width={28} height={16} rx={8} fill="var(--ink-deep)" />
            <rect x={-11} y={-54.5} width={7} height={3} rx={1.5} fill="#ffffff" opacity={0.12} />
            <circle className="ag-eye" cx={-5} cy={-48} r={2.6} fill="#ffffff" />
            <circle className="ag-eye" cx={5} cy={-48} r={2.6} fill="#ffffff" />

            {/* antenna with lighter ball */}
            <line x1={0} y1={-61} x2={0} y2={-71} stroke={fill} strokeWidth={1.8} strokeLinecap="round" />
            <circle cx={0} cy={-72.5} r={3.5} fill={fill} />
            <circle cx={0} cy={-72.5} r={3.5} fill="#ffffff" opacity={0.45} />
          </g>
        </g>

        {/* floating status dot above the antenna */}
        <circle className="ag-status" cx={0} cy={sit ? -75 : -85} r={4} fill={STATUS_CSS[status]} />
      </g>

      {/* generous invisible hit area */}
      <rect x={-32} y={-92} width={64} height={104} fill="transparent" />
    </g>
  )
}
