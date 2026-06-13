import { contextBridge, ipcRenderer } from 'electron'
import type { FileNode } from './fs-tree'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
  readTree: (root: string): Promise<FileNode[]> => ipcRenderer.invoke('fs:readTree', root),
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
