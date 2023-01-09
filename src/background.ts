"use strict";


/**electron 렌더러 프로세스 생성 -> BrowserWindow객체 사용**/
import { app, autoUpdater, protocol, BrowserWindow, nativeImage, Menu } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

import { version } from "vue/types/umd";

var CircularJSON = require('circular-json');
const { dialog } = require('electron')
const isDevelopment = process.env.NODE_ENV !== "production";
const contextMenu = require('electron-context-menu')

/**electron 내부 db 사용
npm install electron-db --save**/
// const db = require('electron-db');

/**neDB 사용
 * npm install nedb --save
 * */
const Datastore = require('nedb')
let db = new Datastore({
  filename: `${app.getPath("userData")}/userStorage`, autoload: true
})


/**contextMenu */
contextMenu({
  prepend: (defaultActions: any, parameters: any, browserWindow: BrowserWindow) => [

  ]

})

let dataBahnWindow: BrowserWindow;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);


//DB 데이터 추가 함수
function insertDB(obj: Object) {
  db.insert(obj, function (err: any, newObj: any) {
    if (err) {
      console.log("function insertDB() Err :" + err.message)
    } else {
      console.log("data inserted successfully :" + JSON.stringify(newObj))
    }
  })

}

//DB데이터 수정 함수
function updateDB(current_obj: object, new_obj: Object) {
  db.update(current_obj, { $set: new_obj }, {}, function (err: any, numReplaced: any) {
    if (err) {
      console.log("updateDB err: " + err);

    } else {
      console.log("data changed successfully! new_data: " + JSON.stringify(new_obj))
    }
  })

}

//DB내 정보 출력 함수
function showDB() {
  console.log("showDB: ")
  db.find({}, (err: any, data: any) => {
    console.log(JSON.stringify(data))
  })
}


//DBTable삭제 함수
function clearDB() {
  db.remove({}, { multi: true }, function (err: any, numRemoved: any) {
    //console.log(typeof (err))
    if (err) {
      console.log("clearDB() error : " + err)
    } else {
      console.log("successfully clearDB")
      showDB();
    }
  })
}
function setVuexItemToDB() {
  let obj: any = {}
  dataBahnWindow.webContents.executeJavaScript(`localStorage.getItem("vuex");`, true)
    .then(result => {
      console.log(result)
      if (result) {
        obj['vuex'] = result;
        insertDB(obj);
        return;
      } else {
        return;
      }
    })
    .catch(error => console.log("setWebViewLocalStorageToDB() isOnlyVuex==true일 때 localStorage.getItem" + error))
}
function setAllItemToDB() {
  let obj: any = {}
  if (dataBahnWindow && dataBahnWindow.webContents) {

    dataBahnWindow.webContents.executeJavaScript('Object.keys(localStorage)', true)
      .then(result => {
        //####
        result.forEach(function (v: any) {
          console.log(v)

          dataBahnWindow.webContents.executeJavaScript(`localStorage.getItem("${v}");`, true)
            .then(result => {
              obj[v] = result;
              insertDB(obj)
              return;
            })
            .catch(error => console.log("localStorage.getItem " + error))
        })
      })
      .catch(error => console.log("setWebViewLocalStorageToDB()내부 Object.key(localStorage) " + error));
  } else {
    console.log("data bahn window 혹은 webcontents가 비어있습니다.")
  }
}
//브라우저가 종료되기 전 get localStorage -> DB에 저장
//예외처리 dataBahnWindow,dataBahnWindow.Webcontents가 비어있는 경우 함수 동작X
function setWebViewLocalStorageToDB(isOnlyVuex = false) {
  console.log("setWebViewLocalStorageToDB진입")

  //vuex 값만 get
  if (isOnlyVuex) {
    setVuexItemToDB();
  }
  //localStorage에 있는 모든 데이터 get
  else {
    setAllItemToDB();
  }
}
function setVuexToLocalStorage(win: BrowserWindow) {
  let keyArr: any;
  let valueArr: any;
  db.find({}, (err: any, data: any) => {
    if (err) {
      console.log("setLocalStorage함수 내부 error :" + err)
    }
    else {
      if (data[0]) {
        keyArr = Object.keys(data[0]);
        valueArr = Object.values(data[0])
        keyArr.forEach((mykey: any, index: number) => {
          if (mykey == "vuex") {
            win.webContents.executeJavaScript("localStorage.setItem('" + mykey + "','" + valueArr[index] + "');")
              .then(result => {
                console.log(`localStorage내부 setItem성공 key:${mykey}`)
                return;
              })
              .catch(error => {
                console.log("setLocalStorage함수 내 vuex세팅 " + error);
              })
          }
        })
      }
      else {
        console.log("db가 비어있으므로  set LocalStroage 작동하지 않습니다.")
        return;
      }
    }
    clearDB();
  })
}
function setAllToLocalStorage(win: BrowserWindow) {
  let keyArr: any;
  let valueArr: any;

  db.find({}, (err: any, data: any) => {
    if (err) {
      console.log("setLocalStorage함수 내부 error :" + err)
    }
    else {
      if (data && data.length > 0 && data[0]) {
        keyArr = Object.keys(data[0]);
        valueArr = Object.values(data[0])
        if (keyArr) {
          keyArr.forEach((mykey: any, index: number) => {
            console.log(mykey)
            if (mykey != "_id") {
              win.webContents.executeJavaScript("localStorage.setItem('" + mykey + "','" + valueArr[index] + "');")
                .then(result => {
                  console.log(`localStorage내부 setItem성공 key:${mykey}`)
                  return;
                })
                .catch(error => {
                  console.log(`setLocalStorage함수 호출 시 key: ${mykey} setITem ` + error);
                })
            }
          })
        }
      } else {
        console.log("db가 비어있으므로 set LocalStroage 작동하지 않습니다.")
        return;
      }

    }
    clearDB();
  })
}
//webview의 localStorage 초기화 후 DB에 있던 데이터를 집어 넣는 함수
//예외처리 db가 존재하지 않거나, db에 저장된 값이 없는경우 함수 작동하지 않음
function setLocalStorage(win: BrowserWindow, isOnlyVuex = false) {

  //localStorage 비우기
  win.webContents.executeJavaScript("localStorage.clear()")
    .catch(error => console.log(error));

  if (db) {
    console.log("db존재합니다 ")

    if (isOnlyVuex) {
      setVuexToLocalStorage(win)
    } else {
      setAllToLocalStorage(win)
    }
  }
  else {
    console.log("db가 존재하지 않음 setLocalStorage함수 종료.")
    return;
  }
}



async function createWindow() {
  let image = nativeImage.createFromPath("/Users/A/src/electron-sample/public/dataBahnIcon.png")

  const win = new BrowserWindow({
    width: 900,
    height: 600,
    //최소 크기조정
    minHeight: 220,
    minWidth: 550,

    title: "DataBahn",
    icon: image,
    //alwaysOnTop: true,
    //fullscreen: true,
    //titleBarStyle: "hidden",
    //autoHideMenuBar: true,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,

    },
    //frame: false
  });



  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    //await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    await win.loadURL("https://dev.data-bahn.com");
    //if (!process.env.IS_TEST)
    //win.webContents.openDevTools();


  } else {
    createProtocol("app");
    // Load the index.html when not in development
    //win.loadURL("app://./index.html");
    await win.loadURL("https://dev.data-bahn.com");
  }

  dataBahnWindow = win;
  //#######@@@
  // let image = nativeImage.createFromPath("/Users/A/src/electron-sample/src/dataBahnIcon.png")


  const options = {
    type: 'question',
    buttons: ['yes', 'no'],
    message: '정말 종료하시겠습니까?',
    title: "dataBahn",
    icon: image
  }
  if (dataBahnWindow) {
    dataBahnWindow.webContents.executeJavaScript("window.addEventListener('beforeunload',function(event){event.returnValue='exit?'})", true)
      .catch(error => console.log("createWindow() 내부 addEventListener " + error))

    dataBahnWindow.on('close', (event) => {

      //dataBahnWindow.webContents.executeJavaScript("alert('program exit')")
      //정말로 종료하시겠습니까? 확인 ->
      dialog.showMessageBox(options).then(function (res) {
        if (res.response == 1) {  //아니오
          console.log("showmessage response 1")
        } else {  //예
          console.log("showmessage response 0")
          dataBahnWindow.destroy();
          app.quit();
        }
      })
      try {
        setWebViewLocalStorageToDB(true);
      } catch (error) {
        console.log(error)
        console.log("setWebViewLocalStorageToDB함수 try-catch error ")
      }
    })
  } else {
    console.log("win 객체가 비어있습니다.")
  }
}


app.on("ready", async () => {
  // console.log("1")
  let image = nativeImage.createFromPath("/Users/A/src/electron-sample/public/dataBahnIcon.png")

  if (isDevelopment && !process.env.IS_TEST) {

    try {
      await installExtension(VUEJS_DEVTOOLS);
      //vue 속성
      await installVueDevtools();
    } catch (e: any) {
      console.error("Vue Devtools failed to install:", e.toString());

    }
  }
  // console.log("3")
  createWindow();
  //console.log("4")
  showDB();
  //console.log("5")


  //console.log("6")
  if (BrowserWindow.getAllWindows().length == 0) {
    console.log("length=0")
  } else {
    //console.log("7")
    var win = BrowserWindow.getAllWindows()[0];
    console.log(BrowserWindow.getAllWindows().length)
    setLocalStorage(win, true)






    const template = [
      {
        label: 'Exit',
        submenu: [
          { role: 'quit', accelerator: 'Ctrl+W' }
        ]
      },
      {
        label: 'Service',
        submenu: [
          {
            label: "Version", role: 'help',
            click: async () => {
              const options = {
                type: 'question',
                icon: image,
                message: 'App Version ' + app.getVersion(),
                title: "dataBahn",
              }
              dialog.showMessageBox(options)
            }

          },
          {
            label: "Check for Updates...", role: 'help',
            //click: autoUpdater.checkForUpdates()

          },

        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom', accelerator: 'Ctrl+0' },
          { role: 'zoomIn', accelerator: 'Ctrl+Up' },
          { role: 'zoomOut', accelerator: 'Ctrl+Down' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'More',
        submenu: [
          {
            label: 'Open in Browser', role: 'help',
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://dev.data-bahn.com')
            }
          }
        ]
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)



  }

})



app.on("before-quit", () => {
  //setWebViewLocalStorageToDB();
  console.log("before-quit")

})


app.on("will-quit", () => {
  console.log("will-quit")
})
app.on("quit", () => {
  console.log("quit")
})

// Quit when all windows are closed.
app.on("window-all-closed", () => {

  console.log("window-all-closed2")

  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //console.log(dataBahnWindow)
  if (process.platform !== "darwin") {
    app.quit();

  }
});


// app.on("browser-window-blur", () => {
//   console.log("blur")

// })

// app.on("browser-window-focus", () => {
//   console.log("focus")
// })

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }

});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.






// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}


