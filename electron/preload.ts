import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFolder: (): Promise<string> => ipcRenderer.invoke('dialog:openFolder'),
}

contextBridge.exposeInMainWorld('forkcode', api)

export type ForkcodeApi = typeof api
