if(require('electron-squirrel-startup')) return;
const { app, BrowserWindow, Menu, ipcMain, dialog, screen, Tray, shell, net, autoUpdater } = require('electron')
const path = require('path');
const fs = require('fs')
const os = require('os')
const createShortcut = require('windows-shortcuts')
const startupFolderPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const prompt = require('electron-prompt');
const Store = require('electron-store');
const { DisableMinimize } = require('electron-disable-minimize');
const store = new Store();

import * as Sentry from "@sentry/electron";

Sentry.init({
  dsn: "https://11ed10917af88c3c5fea9733e23d5dcb@o4504797893951488.ingest.us.sentry.io/4507306374070272",
});

let tray = undefined;
let form = undefined;
var win = undefined;
let template = []
let basePath = app.isPackaged ? './resources/app.asar/' : './'
try {
    require('electron-reloader')(module,{});
    } catch (_) {}
const createWindow = () => {
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: 200,
        frame: false,
        transparent: true,
        //alwaysOnTop: store.get('isWindowAlwaysOnTop', true),
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
        resizable: false,
        type: 'toolbar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
    })
    if(!app.isPackaged) {
        win.webContents.openDevTools({mode: 'detach'})
    }
    else {
        autoUpdater.setFeedURL({
            "provider": "generic",
            "url": "http://schedule.bitf1a5h.eu.org:8000/api/update"
        })
        autoUpdater.checkForUpdates()
        autoUpdater.on('error', (info) => {
            console.error('更新错误', info);
        });
        autoUpdater.on('update-available', (info) => {
            console.log('有新版本需要更新');
        });
        autoUpdater.on('update-not-available', (info) => {
            console.log('无需更新');
        });
        autoUpdater.on('update-downloaded', (info) => {
            mainWin.webContents.send('downloaded');
            // 下载完成后强制用户安装
            autoUpdater.quitAndInstall();
        });
    }
    win.loadFile('index.html')
    if (store.get('isWindowAlwaysOnTop', true))
        win.setAlwaysOnTop(true, 'screen-saver', 9999999999999)
}
function setAutoLaunch() {
    const shortcutName = '电子课表.lnk'
    app.setLoginItemSettings({ // backward compatible
        openAtLogin: false,
        openAsHidden: false
    })
    if (store.get('isAutoLaunch', true)) {
        createShortcut.create(startupFolderPath + '/' + shortcutName,
            {
                target: app.getPath('exe'),
                workingDir: app.getPath('exe').split('\\').slice(0, -1).join('\\'),
            }, (e) => { e && console.log(e); })
    } else {
        fs.unlink(startupFolderPath + '/' + shortcutName, () => { })
    }

}
app.whenReady().then(() => {
    createWindow()
    Menu.setApplicationMenu(null)
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('getWeekIndex');
    })
    const handle = win.getNativeWindowHandle();
    DisableMinimize(handle); // Thank to peter's project https://github.com/tbvjaos510/electron-disable-minimize
    setAutoLaunch()
})

ipcMain.on('getWeekIndex', (e, arg) => {
    tray = new Tray(basePath + 'image/icon.png')
    template = [
        {
            label: '激活授权',
            click: () => {
                win.webContents.send('getLicense')
            }
        },
        {
            label: '关于',
            click: () => {
                dialog.showMessageBox(win, {
                    title: '授权信息',
                    message: 'v1.1.1 测试版本不稳定，升级请联系作者\n\nBy ZianTT\nOriginal Author: EnderWolf006\nOriginal Project Link: https://github.com/EnderWolf006/ElectronClassSchedule\nLicense: GPL-3.0\n\n本程序授权给：'+store.get('licenseName', '未授权'),
                    buttons: ['确定']
                })
            }
        },
        {
            type: 'separator'
        },
        {
            icon: basePath + 'image/clock.png',
            label: '矫正计时',
            click: () => {
                win.webContents.send('getTimeOffset')
            }
        },
        {
            type: 'separator'
        },
        {
            label: '开机启动',
            type: 'checkbox',
            checked: store.get('isAutoLaunch', true),
            click: (e) => {
                store.set('isAutoLaunch', e.checked)
                setAutoLaunch()
            }
        },
        {
            type: 'separator'
        },
        {
            icon: basePath + 'image/quit.png',
            label: '退出程序',
            click: () => {
                dialog.showMessageBox(win, {
                    title: '请确认',
                    message: '你确定要退出程序吗?',
                    buttons: ['取消', '确定']
                }).then((data) => {
                    if (data.response) app.quit()
                })
            }
        }
    ]
    template[arg].checked = true
    form = Menu.buildFromTemplate(template)
    tray.setToolTip('电子课表 - by ZianTT')
    function trayClicked() {
        tray.popUpContextMenu(form)
    }
    tray.on('click', trayClicked)
    tray.on('right-click', trayClicked)
    tray.setContextMenu(form)
    win.webContents.send('ClassCountdown', store.get('isDuringClassCountdown', true))
    win.webContents.send('ClassHidden', store.get('isDuringClassHidden', true))
})

ipcMain.on('log', (e, arg) => {
    console.log(arg);
})

ipcMain.on('setIgnore', (e, arg) => {
    if (arg)
        win.setIgnoreMouseEvents(true, { forward: true });
    else
        win.setIgnoreMouseEvents(false);
})

ipcMain.on('checkTop', (e, arg) => {
    if (store.get('isWindowAlwaysOnTop', true) && win.isAlwaysOnTop() === false)
        win.setAlwaysOnTop(true, 'screen-saver', 9999999999999)
})

ipcMain.on('swconfig', (e, arg) => {
    if (arg.type === 'ontop') {
        store.set('isWindowAlwaysOnTop', arg.value)
        if (store.get('isWindowAlwaysOnTop', true))
            win.setAlwaysOnTop(true, 'screen-saver', 9999999999999)
        else
            win.setAlwaysOnTop(false)
    }
    if (arg.type === 'minimize') {
        store.set('isDuringClassHidden', arg.value)
        win.webContents.send('ClassHidden', arg.value)
    }
    if (arg.type === 'count') {
        store.set('isDuringClassCountdown', arg.value)
        win.webContents.send('ClassCountdown', arg.value)
    }
})

ipcMain.on('update', (e, arg) => {
    autoUpdater.checkForUpdates()
})

ipcMain.on('dialog', (e, arg) => {
    dialog.showMessageBox(win, arg.options).then((data) => {
        e.reply(arg.reply, { 'arg': arg, 'index': data.response })
    })
})

ipcMain.on('alert', (e, arg) => {
    dialog.showMessageBox(win, arg.options)
})

ipcMain.on('pop', (e, arg) => {
    tray.popUpContextMenu(form)
})

ipcMain.on('getTimeOffset', (e, arg) => {
    prompt({
        title: '计时矫正',
        label: '请设置课表计时与系统时间的偏移秒数:',
        value: arg.toString(),
        inputAttrs: {
            type: 'number'
        },
        type: 'input',
        height: 180,
        width: 400,
        icon: basePath + 'image/clock.png',
    }).then((r) => {
        if (r === null) {
            console.log('[getTimeOffset] User cancelled');
        } else {
            win.webContents.send('setTimeOffset', Number(r) % 10000000000000)
        }
    })
})

ipcMain.on('getLicense', (e, arg) => {
    prompt({
        title: '授权信息',
        label: '请输入授权码:',
        value: store.get('license', ''),
        inputAttrs: {
            type: 'text'
        },
        type: 'input',
        height: 180,
        width: 400,
    }).then(async (r) => {
        if (r === null) {
            console.log('[getLicense] User cancelled');
        } else {
            store.set('license', r)
            response = await net.fetch('http://schedule.bitf1a5h.eu.org:8000/config?id=' + r)
            if (response.ok) {
                resp = await response.json()
                licenseName = resp.license_name
                if (licenseName === null) {
                    dialog.showMessageBox(win, {
                        title: '激活失败',
                        message: '激活码错误',
                        buttons: ['确定']
                    })
                    store.set('licenseName', '未授权')
                }
                else {
                    dialog.showMessageBox(win, {
                        title: '激活成功',
                        message: '授权给：' + licenseName,
                        buttons: ['确定']
                    }).then(()=>{
                        win.webContents.send('setLicense', r)
                    })
                    store.set('licenseName', licenseName)
                }
            }
            else {
                dialog.showMessageBox(win, {
                    title: '激活失败',
                    message: '网络错误',
                    buttons: ['确定']
                })
            }
            
            
        }
    })
})
