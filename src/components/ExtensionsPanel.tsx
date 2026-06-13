import './Sidebar.css'

export function ExtensionsPanel() {
  return (
    <div className="sb-placeholder">
      <span className="sb-ph-title">EXTENSIONS</span>
      <p className="sb-ph-msg">
        Managed by ForkCode. Agent roles are configured as custom agents in
        <code> .claude/agents/</code>.
      </p>
    </div>
  )
}
