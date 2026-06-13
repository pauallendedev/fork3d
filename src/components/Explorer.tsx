import { useState } from 'react'
import { AGENT_CSS, useStore } from '../state/store'
import type { FileNode } from '../state/types'
import './Explorer.css'

/** Shared lucide-style stroke props (§1). */
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Row indentation: 10 + depth×14 (§6). */
function pad(depth: number): number {
  return 10 + depth * 14
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? 'ex-chevron ex-chevron-open' : 'ex-chevron'}
      width={13}
      height={13}
      viewBox="0 0 24 24"
      {...STROKE}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
      <circle cx={5} cy={12} r={1} />
      <circle cx={12} cy={12} r={1} />
      <circle cx={19} cy={12} r={1} />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="ex-icon" width={15} height={15} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#dbe4f0"
        d="M3.5 6.5a2 2 0 0 1 2-2h4.2l2 2.2h6.8a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"
      />
    </svg>
  )
}

function FileIcon({ node }: { node: FileNode }) {
  switch (node.icon) {
    case 'agent':
      return (
        <svg className="ex-icon" width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
          <circle cx={7.5} cy={7.5} r={4.5} fill={node.color ? AGENT_CSS[node.color] : 'var(--text-3)'} />
        </svg>
      )
    case 'flow':
      return (
        <svg className="ex-icon ex-ic-flow" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <path d="M6 3v12" />
          <circle cx={18} cy={6} r={3} />
          <circle cx={6} cy={18} r={3} />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      )
    case 'env':
      return (
        <svg className="ex-icon ex-ic-env" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <path d="M4 8h8.5" />
          <circle cx={16.5} cy={8} r={2.5} />
          <path d="M20 16h-8.5" />
          <circle cx={7.5} cy={16} r={2.5} />
        </svg>
      )
    case 'spatial':
      return (
        <svg className="ex-icon ex-ic-spatial" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      )
    case 'yaml':
      return (
        <svg className="ex-icon ex-ic-yaml" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
          <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
        </svg>
      )
    case 'license':
      return (
        <svg className="ex-icon ex-ic-license" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <circle cx={12} cy={9} r={5.5} />
          <path d="m8.6 13.5-1.4 7 4.8-2.8 4.8 2.8-1.4-7" />
        </svg>
      )
    case 'md':
    default:
      return (
        <svg className="ex-icon ex-ic-md" width={15} height={15} viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
          <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
          <path d="M15 3v4h4" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      )
  }
}

function Badge({ badge }: { badge: FileNode['badge'] }) {
  switch (badge) {
    case 'M':
      return <span className="ex-badge ex-badge-m">M</span>
    case 'U':
      return <span className="ex-badge ex-badge-u">U</span>
    case 'check':
      return (
        <svg
          className="ex-badge ex-badge-check"
          width={12}
          height={12}
          viewBox="0 0 24 24"
          {...STROKE}
          strokeWidth={2.4}
          aria-hidden="true"
        >
          <path d="m5 13 5 5L20 7" />
        </svg>
      )
    case 'dot':
      return <span className="ex-badge ex-badge-dot" />
    default:
      return null
  }
}

function FolderRow({ node, depth }: { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button
        type="button"
        className="ex-row"
        style={{ paddingLeft: pad(depth) }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <ChevronIcon open={open} />
        <FolderIcon />
        <span className="ex-name">{node.name}</span>
      </button>
      {open && node.children && (
        <div className="ex-children">
          {node.children.map((child) => (
            <NodeRow key={child.path ?? child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  )
}

function FileRow({ node, depth }: { node: FileNode; depth: number }) {
  const selected = useStore((s) => s.selected)
  const selectAgent = useStore((s) => s.selectAgent)
  const agentColor = node.icon === 'agent' ? node.color : undefined
  const isSelected = agentColor !== undefined && agentColor === selected
  return (
    <button
      type="button"
      className={isSelected ? 'ex-row ex-row-selected' : 'ex-row'}
      style={{ paddingLeft: pad(depth) }}
      onClick={agentColor ? () => selectAgent(agentColor) : undefined}
    >
      <FileIcon node={node} />
      <span className="ex-name">{node.name}</span>
      <Badge badge={node.badge} />
    </button>
  )
}

function NodeRow({ node, depth }: { node: FileNode; depth: number }) {
  return node.type === 'folder' ? <FolderRow node={node} depth={depth} /> : <FileRow node={node} depth={depth} />
}

export function Explorer({ rootName, nodes }: { rootName: string; nodes: FileNode[] }) {
  const [rootOpen, setRootOpen] = useState(true)
  return (
    <div className="ex-root">
      <div className="ex-header">
        <span className="ex-title">EXPLORER</span>
        <button type="button" className="ex-more" aria-label="More actions">
          <MoreIcon />
        </button>
      </div>

      <div className="ex-tree">
        <button
          type="button"
          className="ex-row ex-row-root"
          style={{ paddingLeft: pad(0) }}
          onClick={() => setRootOpen((o) => !o)}
          aria-expanded={rootOpen}
        >
          <ChevronIcon open={rootOpen} />
          <span className="ex-name">{rootName}</span>
        </button>
        {rootOpen && (
          <div className="ex-children">
            {nodes.map((node) => (
              <NodeRow key={node.path ?? node.name} node={node} depth={1} />
            ))}
          </div>
        )}
      </div>

      <div className="ex-pinned">
        <button type="button" className="ex-pinned-header">
          <ChevronIcon open={false} />
          <span>OUTLINE</span>
        </button>
        <button type="button" className="ex-pinned-header">
          <ChevronIcon open={false} />
          <span>TIMELINE</span>
        </button>
      </div>
    </div>
  )
}
