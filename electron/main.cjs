const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, net, protocol, shell } = require('electron')

const DIST = path.join(__dirname, '..', 'dist')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 420,
    minHeight: 560,
    title: 'Daymark',
    backgroundColor: '#f7f8fb',
    icon: path.join(DIST, 'icons', 'icon-512.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#ffffff', symbolColor: '#1F394C', height: 40 },
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  })

  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.loadURL('app://daymark/index.html')
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  app.whenReady().then(() => {
    protocol.handle('app', (request) => {
      const { pathname } = new URL(request.url)
      const filePath = path.join(DIST, decodeURIComponent(pathname === '/' ? '/index.html' : pathname))
      if (!filePath.startsWith(DIST + path.sep)) return new Response('Not found', { status: 404 })
      return net.fetch(pathToFileURL(filePath).toString())
    })
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
