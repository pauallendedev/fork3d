import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { FileNode } from './fs-tree'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
  readTree: (root: string): Promise<FileNode[]> => ipcRenderer.invoke('fs:readTree', root),
  readFile: (path: string): Promise<import('../src/state/types').FilePayload> =>
    ipcRenderer.invoke('fs:readFile', path),
  connectProject: (root: string): Promise<{ ok: boolean; port: number }> =>
    ipcRenderer.invoke('project:connect', root),
  isConnected: (root: string): Promise<boolean> => ipcRenderer.invoke('project:isConnected', root),
  onEvent: (cb: (ev: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, ev: unknown) => cb(ev)
    ipcRenderer.on('app:event', listener)
    return () => ipcRenderer.off('app:event', listener)
  },
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
