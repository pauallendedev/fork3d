import { useEffect, useState } from 'react'
import type { FilePayload } from '../state/types'
import { highlight } from '../lib/highlighter'
import './FileView.css'

interface FileState {
  path: string
  payload: FilePayload | null
  html: string
}

export function FileView({ path }: { path: string }) {
  const [loaded, setLoaded] = useState<FileState | null>(null)

  useEffect(() => {
    let cancelled = false
    const fc = window.forkcode
    const filePromise: Promise<FilePayload> = fc
      ? fc.readFile(path)
      : Promise.resolve({ content: '', lang: 'text', truncated: false, binary: false })
    filePromise.then(async (p) => {
      if (cancelled) return
      let html = ''
      if (!p.binary && !p.truncated && p.content) {
        try {
          html = await highlight(p.content, p.lang)
        } catch {
          /* fall back to plain text below */
        }
      }
      if (!cancelled) setLoaded({ path, payload: p, html })
    })
    return () => {
      cancelled = true
    }
  }, [path])

  // Show loading indicator while waiting for the current path's data
  if (!loaded || loaded.path !== path) return <div className="fv-msg">Loading…</div>
  const { payload, html } = loaded
  if (!payload) return <div className="fv-msg">Could not read file.</div>
  if (payload.binary) return <div className="fv-msg">Binary file — preview not available.</div>
  if (payload.truncated) return <div className="fv-msg">File too large to preview.</div>
  if (html)
    return (
      <div
        className="fv-code"
        // Shiki escapes all token text; input is a local file read via guarded IPC
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  return <pre className="fv-plain">{payload.content}</pre>
}
