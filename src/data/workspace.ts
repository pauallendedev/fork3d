import type { FileNode } from '../state/types'

export const WORKSPACE_NAME = 'SAMS-WORKSPACE'

export const TREE: FileNode[] = [
  {
    name: 'agents',
    type: 'folder',
    children: [
      { name: 'blue-agent', type: 'file', icon: 'agent', color: 'blue', badge: 'M' },
      { name: 'green-agent', type: 'file', icon: 'agent', color: 'green', badge: 'U' },
      { name: 'orange-agent', type: 'file', icon: 'agent', color: 'orange', badge: 'M' },
      { name: 'purple-agent', type: 'file', icon: 'agent', color: 'purple', badge: 'M' },
      { name: 'red-agent', type: 'file', icon: 'agent', color: 'red', badge: 'U' },
      { name: 'yellow-agent', type: 'file', icon: 'agent', color: 'yellow', badge: 'M' },
    ],
  },
  {
    name: 'workflows',
    type: 'folder',
    children: [
      { name: 'onboarding.flow', type: 'file', icon: 'flow', badge: 'check' },
      { name: 'code-review.flow', type: 'file', icon: 'flow', badge: 'check' },
      { name: 'deploy.flow', type: 'file', icon: 'flow', badge: 'check' },
    ],
  },
  {
    name: 'environments',
    type: 'folder',
    children: [
      { name: 'dev.env', type: 'file', icon: 'env', badge: 'check' },
      { name: 'staging.env', type: 'file', icon: 'env', badge: 'dot' },
      { name: 'prod.env', type: 'file', icon: 'env', badge: 'check' },
    ],
  },
  {
    name: 'assets',
    type: 'folder',
    children: [
      { name: 'architecture.spatial', type: 'file', icon: 'spatial', badge: 'M' },
      { name: 'office-layout.spatial', type: 'file', icon: 'spatial', badge: 'M' },
      { name: 'furniture.spatial', type: 'file', icon: 'spatial', badge: 'U' },
    ],
  },
  {
    name: 'configs',
    type: 'folder',
    children: [
      { name: 'sams.yaml', type: 'file', icon: 'yaml', badge: 'M' },
      { name: 'agents.yaml', type: 'file', icon: 'yaml', badge: 'M' },
      { name: 'permissions.yaml', type: 'file', icon: 'yaml', badge: 'U' },
    ],
  },
  { name: 'README.md', type: 'file', icon: 'md', badge: 'M' },
  { name: 'CHANGELOG.md', type: 'file', icon: 'md', badge: 'U' },
  { name: 'LICENSE', type: 'file', icon: 'license', badge: 'U' },
]
