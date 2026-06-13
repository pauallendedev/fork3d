import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { readTree } from './fs-tree'
import { startServer } from './server'
import { normalize } from '../src/telemetry/normalize'
import { installHooks, hooksInstalled } from './hooks-config'
import { projectSettingsPath, readSettings, writeSettings } from './settings-io'

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const PORT = 4517

let mainWindow: BrowserWindow | null = null
let projectRoot = ''

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0e1116',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// One loopback server for the app's lifetime.
startServer({
  port: PORT,
  onBody: (endpoint, body) => {
    const raw = (body ?? {}) as Record<string, unknown>
    // only forward events for the currently-open project
    if (projectRoot && typeof raw.cwd === 'string' && raw.cwd !== projectRoot) return
    const ev = normalize(endpoint, raw, Date.now())
    if (ev) mainWindow?.webContents.send('app:event', ev)
  },
})

ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (canceled) return ''
  projectRoot = filePaths[0]
  return projectRoot
})

ipcMain.handle('fs:readTree', async (_e, root: string) => {
  if (!root) return []
  projectRoot = root
  return readTree(root)
})

ipcMain.handle('project:connect', async (_e, root: string) => {
  const file = projectSettingsPath(root)
  const next = installHooks(readSettings(file), PORT)
  writeSettings(file, next)
  return { ok: true, port: PORT }
})

ipcMain.handle('project:isConnected', async (_e, root: string) => {
  return hooksInstalled(readSettings(projectSettingsPath(root)))
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
