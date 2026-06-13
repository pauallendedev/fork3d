import { GroundShadow, IsoBox } from '../iso'

export function Plant() {
  return (
    <g>
      <GroundShadow w={40} opacity={0.09} />
      <IsoBox w={26} d={26} h={18} top="#e8ecf1" left="#d5dae2" right="#cdd4dd" />
      <g transform="translate(0 -16)">
        <path d="M0 0 C -2 -14, -14 -22, -22 -26 C -12 -28, -4 -20, 0 -8 Z" fill="#2e9d62" />
        <path d="M0 0 C 2 -14, 14 -22, 22 -26 C 12 -28, 4 -20, 0 -8 Z" fill="#34b873" />
        <path d="M0 -2 C -1 -16, -8 -28, -13 -34 C -4 -32, 1 -22, 1 -10 Z" fill="#34b873" />
        <path d="M0 -2 C 1 -16, 8 -28, 13 -34 C 4 -32, -1 -22, -1 -10 Z" fill="#2e9d62" />
        <path d="M0 -4 C 0 -20, 0 -30, 0 -38 C 3 -30, 3 -18, 1 -8 Z" fill="#3dbe7b" />
        <path d="M-1 -4 C -3 -18, -2 -28, -4 -36 C 1 -28, 1 -16, 0 -8 Z" fill="#2e9d62" />
      </g>
    </g>
  )
}
