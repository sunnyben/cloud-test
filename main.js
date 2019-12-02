const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const {autoUpdater} = require('electron-updater')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')
const Store = require('electron-store')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({ name: 'Settings'})
const fileStore = new Store({ name: 'Files Data'})
let mainWindow, settingsWindow

const createmanager= () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucketName = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucketName)
}
app.on('ready', () => {
  // mainWindow = new BrowserWindow({
  //   width: 1024,
  //   height: 680,
  //   webPreferences: {
  //     nodeIntegration: true
  //   }
  // })
  autoUpdater.autoDownload = false
  autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error === null ? 'unkown': error)
  })
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: `info`,
      message: `发现新版本，是否现在更新`,
      title: `应用有新的版本`,
      buttons: ['是', '否']
    }, (buttonIndex) => {
      if(buttonIndex === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })
  autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      type: `info`,
      message: `当前已经是最新版本`,
      title: `没有新版本`
    })
  })

  const mainWindowConfig = {
    width: 900,
    height: 600
  }

  const urlLocation = isDev ? 'http://localhost:3000': `file://${path.join(__dirname, './index.html')}`
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  // mainWindow.loadURL(urlLocation)
  mainWindow.on('closed', () => {
    mainWindow = null

  })

  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  })

  ipcMain.on('open-test-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingsFileLocation = `file://${path.join(__dirname, './testPage/index.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  })

  ipcMain.on('upload-all-to-qiniu', (event, data) => {
    mainWindow.webContents.send('loading-status', true)
    const manager = createmanager()
    const filesObj = fileStore.get('files') || {}
    const uploadPromiseArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key]
      return manager.uploadFile(`${file.title}.md`, file.path)
    })
    Promise.all(uploadPromiseArr).then((result) => {
      dialog.showMessageBox({
        type: `info`,
        message: `成功上传了${result.length}个文件`,
        title: `成功上传了${result.length}个文件`
      })
      mainWindow.webContents.send('file-uploaded')
    }).catch((err) => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数')
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false)
    })
    // setTimeout(() => {
    //   mainWindow.webContents.send('loading-status', false)
    // }, 2000)
  })

  ipcMain.on('upload-file', (event, data) => {
    const manager = createmanager()
    manager.uploadFile(data.key, data.path).then(data => {
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数')
    })
  })

  ipcMain.on('config-is-saved', () => {
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3]: menu.items[2]
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle
      })
    }
    const qiniuIsConfiged =  ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
    switchItems(qiniuIsConfiged)
  })
  ipcMain.on('download-file', (event, data) => {
    const manager = createmanager()
    const filesObj = fileStore.get('files')
    const {key, path, id} = data
    manager.getStat(data.key).then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000) 
      console.log('qiniu', serverUpdatedTime)
      console.log('data--', data)
      console.log('filesObj--', filesObj)
      const localUpdatedTime = filesObj[id].updatedAt
      console.log('local', localUpdatedTime)
      if(serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
        manager.downloadFile(key, path).then(() => {
          mainWindow.webContents.send('file-downloaded', {status: 'download-success', id})
        })
      } else {
        mainWindow.webContents.send('file-downloaded', {status: 'on-new-file', id})
      }
    }, (error) => {
      if(error.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', {status: 'no-file', id})
      }
    })
  })

})