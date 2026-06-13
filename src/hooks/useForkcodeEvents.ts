import { useEffect } from 'react'
import { useStore } from '../state/store'
import type { AgentEvent } from '../telemetry/types'

const DEMO_ROLES = ['Ingeniero', 'Desarrollador', 'Tester', 'Analista', 'Desarrollador']

/** Subscribe to real telemetry from Electron, or run a demo when toggled on. */
export function useForkcodeEvents() {
  const applyEvent = useStore((s) => s.applyEvent)
  const reap = useStore((s) => s.reap)
  const setConnected = useStore((s) => s.setConnected)
  const demo = useStore((s) => s.demo)

  // real events
  useEffect(() => {
    const fc = window.forkcode
    if (!fc?.onEvent) return
    setConnected(true)
    const unsub = fc.onEvent((ev) => applyEvent(ev as AgentEvent))
    return () => {
      unsub?.()
      setConnected(false)
    }
  }, [applyEvent, setConnected])

  // reap stopped agents on a timer
  useEffect(() => {
    const t = setInterval(reap, 500)
    return () => clearInterval(t)
  }, [reap])

  // demo mode: spawn a few agents, then retire them on a loop
  useEffect(() => {
    if (!demo) return
    let i = 0
    const spawn = () => {
      const id = `demo-${i}`
      applyEvent({ kind: 'agent:start', agentId: id, role: DEMO_ROLES[i % DEMO_ROLES.length], instructions: 'Demo task', cwd: '', sessionId: 'demo', ts: Date.now() })
      const myId = id
      setTimeout(() => applyEvent({ kind: 'agent:stop', agentId: myId, cwd: '', ts: Date.now() }), 6000)
      i++
    }
    spawn()
    const t = setInterval(spawn, 2500)
    return () => clearInterval(t)
  }, [demo, applyEvent])
}
