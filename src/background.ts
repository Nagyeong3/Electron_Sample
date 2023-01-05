"use strict";


/**electron 렌더러 프로세스 생성 -> BrowserWindow객체 사용**/
import { app, protocol, BrowserWindow, webContents, ipcMain } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

const { dialog } = require('electron')
const isDevelopment = process.env.NODE_ENV !== "production";

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


let dataBahnWindow: BrowserWindow;

//localStorage 데이터를 없애고 DB에 있던 데이터를 집어 넣는 함수
async function SetLocalStorage(win: BrowserWindow, isOnlyVuex = false) {


  //localStorage 비우기
  await win.webContents.executeJavaScript("localStorage.clear()")
    .catch(error => console.log(error));

  //내가 원하는 값으로 localStorage세팅
  let keyArr: any;
  let valueArr: any;

  if (db) {
    console.log("db존재합니다 ")
    if (isOnlyVuex) {
      db.find({}, (err: any, data: any) => {
        if (err) {
          console.log("setLocalStorage함수 내부 error :" + err)
        } else {
          if (data[0] != null) {
            keyArr = Object.keys(data[0]);
            valueArr = Object.values(data[0])
            keyArr.forEach((mykey: any, index: number) => {
              if (mykey == "vuex") {
                win.webContents.executeJavaScript("localStorage.setItem('" + mykey + "','" + valueArr[index] + "');")
                  .then(result => {
                    console.log(`localStorage내부 setItem성공 key:${mykey}`)
                  })
                  .catch(error => {
                    console.log("setLocalStorage함수 호출 시 ");
                    console.log(error);
                  })
              }
            })
          } else {
            return;
          }
        }
        clearDB();
      })
    } else {
      db.find({}, (err: any, data: any) => {
        if (err) {
          console.log("setLocalStorage함수 내부 error :" + err)
        }
        else {
          if (data[0] != null) {
            keyArr = Object.keys(data[0]);
            valueArr = Object.values(data[0])
            if (keyArr != null) {
              keyArr.forEach((mykey: any, index: number) => {
                if (mykey != "_id") {
                  win.webContents.executeJavaScript("localStorage.setItem('" + mykey + "','" + valueArr[index] + "');")
                    .then(result => {
                      console.log(`localStorage내부 setItem성공 key:${mykey}`)
                    })
                    .catch(error => {
                      console.log("setLocalStorage함수 호출 시 ");
                      console.log(error);
                    })
                }
              })
            }
          } else {
            return;
          }

        }
        clearDB();
      })
    }
  } else {
    console.log("db가 존재하지 않음")
    console.log(db)
  }
}

//DB 데이터 추가 함수
function insertDB(obj: Object) {
  db.insert(obj, function (err: any, newObj: any) {
    if (err) {
      console.log("function insertDB() Err :" + err)
    } else {
      console.log("data inserted successfully :" + JSON.stringify(newObj))
    }
  })

}

//DB데이터 수정 함수
function changeValue(current_obj: object, new_obj: Object) {
  db.update(current_obj, { $set: new_obj }, {}, function (err: any, numReplaced: any) {
    if (err) {
      console.log("changeValue err: " + err);

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

//브라우저가 종료되기 전 localStorage에 접근하고 DB에 
function DBLogic(isOnlyVuex = false) {
  console.log("DBLogic진입")


  let length = 0;
  let t: any;
  let obj: any = {}
  if (isOnlyVuex == true) {
    dataBahnWindow.webContents.executeJavaScript(`localStorage.getItem("vuex");`, true)
      .then(result => {
        console.log(result)
        if (result != null) {
          let keyname = 'vuex';
          obj[keyname] = result;
          insertDB(obj);
        } else {
          return;
        }
      })
      .catch(error => console.log(error))
  } else {
    if (dataBahnWindow && dataBahnWindow.webContents) {
      dataBahnWindow.webContents.executeJavaScript('localStorage.length', true)
        .then(result => {
          console.log(result)
          length = result;
          dataBahnWindow.webContents.executeJavaScript('Object.keys(localStorage)', true)
            .then(result => {
              //console.log(result)
              t = JSON.stringify(result);
              t = t.split('[');
              t = t[1].split(']')
              t = t[0].split('"')
              for (let i = 0; i < t.length; i++) {
                if (i % 2 != 0) {
                  //console.log(t[i])
                  dataBahnWindow.webContents.executeJavaScript(`localStorage.getItem("${t[i]}");`, true)
                    .then(result => {
                      let keyname = t[i];
                      obj[keyname] = result;
                      if (i == t.length - 2) {
                        insertDB(obj);
                        // changeValue({ pet: 'dog' }, { pet: 'cat' })
                        //console.log(db)

                      }
                    })
                    .catch(error => console.log(error))
                }

              }
            })
            .catch(error => console.log(error));
        })
    } else {
      console.log(" data bahn window 혹은 webcontents가 비어있습니다.")
    }
  }
}


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    //최소 크기조정
    minHeight: 300,
    title: "test123",
    //alwaysOnTop: true,
    //fullscreen: true,
    //titleBarStyle: "hidden",

    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  });



  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    //await win.loadURL("https://dev.data-bahn.com");
    if (!process.env.IS_TEST) win.webContents.openDevTools();


  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");

  }

  dataBahnWindow = win;
  const options = {
    type: 'question',
    buttons: ['yes', 'no'],
    message: '정말 종료하시겠습니까?',
    title: "dataBahn"
  }
  if (dataBahnWindow) {
    dataBahnWindow.webContents.executeJavaScript("window.addEventListener('beforeunload',function(event){event.returnValue='exit?'})", true).catch(error => console.log(error))

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
        DBLogic();
      } catch (error) {
        console.log(error)
        console.log("DBLogic함수 try-catch error ")
      }
    })
  } else {
    console.log("win 객체가 비어있습니다.")
  }

}


app.on("ready", async () => {
  console.log("1")
  if (isDevelopment && !process.env.IS_TEST) {

    try {
      console.log("2")
      await installExtension(VUEJS_DEVTOOLS);
      //vue 속성
      await installVueDevtools();
    } catch (e: any) {
      console.error("Vue Devtools failed to install:", e.toString());

    }
  }
  console.log("3")
  createWindow();
  console.log("4")
  showDB();
  console.log("5")


  console.log("6")
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log("length=0")
  } else {
    console.log("7")
    var win = BrowserWindow.getAllWindows()[0];
    console.log(BrowserWindow.getAllWindows().length)
    SetLocalStorage(win)

    //validDB();


    console.log("8")

  }



})



app.on("before-quit", () => {
  //DBLogic();
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


