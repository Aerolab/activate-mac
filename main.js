const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let activateWindows = []

function createWindows() {
  const displays = electron.screen.getAllDisplays()

  for( display of displays ) {
    createWindow(display)
  }

  // Hide the dock icon *after* the windows load 
  // If not, the app won't start in production
  app.dock.hide()
}


function createWindow(display) {
  let { x:displayX, y:displayY, width, height } = display.bounds

  let mainWindow = null

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 300, 
    height: 60,
    x: displayX + width - 380,
    y: displayY + height - 110,
    opacity: 0.4,
    transparent: true,
    alwaysOnTop: true,
    frame: false
  })

  mainWindow.display = display

  mainWindow.setIgnoreMouseEvents(true)
  mainWindow.setVisibleOnAllWorkspaces(true)

  // and load the index.html of the app
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Prevent closing the app :D
  mainWindow.on('close', function (e) {
    // This is really annoying during development
    if( process.env.NODE_ENV === 'development' ) { return }

    e.preventDefault()
    electron.dialog.showErrorBox(`Nah`, `Nah`)
    return false
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function (e) {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  activateWindows.push(mainWindow)
}


function pruneWindows() {
  const displays = electron.screen.getAllDisplays()

  for( window of activateWindows ) {
     if( ! displays.find((d) => d.id === window.display.id) ) {
      window.close()
      activateWindows.splice( activateWindows.indexOf(window), 1 )
      window = null
    }
  }
}


function repositionWindows() {
  const displays = electron.screen.getAllDisplays()

  for( window of activateWindows ) {
    let display = displays.find((d) => d.id === window.display.id)
    if( ! display ) continue
    
    window.setPosition( display.bounds.x + display.bounds.width - 380,
                        display.bounds.y + display.bounds.height - 110)
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  createWindows()

  electron.screen.on('display-added', function (event, newDisplay) {
    createWindow(newDisplay)
  })
  
  electron.screen.on('display-removed', pruneWindows)
  
  electron.screen.on('display-metrics-changed', function () {
    repositionWindows()
  })
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (! activateWindows.length) {
    createWindows()
  }
})