"use strict";


/**electron 렌더러 프로세스 생성 -> BrowserWindow객체 사용**/
import { app, protocol, BrowserWindow, webContents, ipcMain } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";


const isDevelopment = process.env.NODE_ENV !== "production";

const db = require('electron-db');

let dataBahnWindow: BrowserWindow;


//DB 존재여부 검사 함수
function validDB(DBName: string) {
  //console.log(db.valid('UserStorages'))
  try {
    if (db.valid(DBName)) {
      console.log("valid");
      return true;
    }
  } catch (e: any) {
    console.log("unvalid");
    return false;
  }
}

//DB생성함수
function createDB(DBName: string) {
  db.createTable(DBName, (succ: any) => {
    if (succ) {
      console.log("dataTable successfully create!")
    } else {
      console.log("error in Creating dataTable ")
    }
  })
}

//DB 데이터 추가 함수
function insertDB(DBName: string, obj: Object) {

  db.insertTableContent(DBName, obj, (ttt: any) => {
    if (ttt) {
      console.log("dataTable successfully insert!")
      console.log("insert data : " + JSON.stringify(obj))
    }

  })
}

//DB데이터 수정 함수
function changeValue(DBName: string, mykey: object, changeValue: Object) {
  db.updateRow(DBName, mykey, changeValue, (succ: any, msg: any) => {
    console.log("change value 확인")
    console.log(succ)
    if (succ) {
      console.log("change success")
      getDB();
    } else {
      console.log(msg)
    }
  })

}

//DB내 정보 출력 함수
function getDB() {
  db.getAll('UserStorage', (succ: any, data: any) => {
    console.log("DB에 저장된 data:  " + JSON.stringify(data))
  })
}

//DB레코드 삭제 함수
function deleteRecords(id: number) {
  db.deleteRow('UserStorage', { "id": id }, (succ: string) => {
    console.log("data delete complete??")
  })
}

//DBTable삭제 함수
function clearTable(DBName: string) {
  db.clearTable(DBName, (succ: string) => {
    if (succ)
      console.log("clear success")
    getDB();
  })
}

function DBLogic() {
  console.log("DBLogic진입")

  let length = 0;

  type MyObject = {
    key: string,
    value: string,
  }

  const obj: MyObject = {
    key: "vuex",
    value: "null",
  }

  let where = { 'key': 'vuex' }
  let set = { 'value': 'dogg' }
  dataBahnWindow.webContents.executeJavaScript('localStorage.length', true)
    .then(result => {
      //console.log(result)
      length = result;
    })

  dataBahnWindow.webContents.executeJavaScript('Object.keys(localStorage)', true)
    .then(result => {
      //console.log(result)
      let str = JSON.stringify(result)
      let splitted = str.split('[')

      let s = splitted[1].split('"')

      for (let i = 0; i < length * 2 + 1; i++) {

        //console.log(dataBahnWindow.webContents)
        if (s[i] == "vuex") {

          dataBahnWindow.webContents.executeJavaScript('localStorage.getItem("vuex");', true)
            .then(result => {
              //console.log(result)

              obj.value = result;
              if (validDB('UserStorage')) {
                console.log("DB존재합니다 insert시작. . .")
                insertDB('UserStorage', obj);
                //changeValue('UserStorage', where, set)
              }
              else {
                console.log("DB존재하지 않습니다. create시작. . .")
                createDB('UserStorage');
                insertDB('UserStorage', obj);
                //changeValue('UserStorage', where, set)
              }



            })
            .catch(error => console.log(error))
          return 0;
        }
      }


    })
    .catch(error => console.log(error));



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
  dataBahnWindow.on('close', (event) => {

    //dataBahnWindow.webContents.executeJavaScript("alert('program exit')")
    try {
      DBLogic();
    } catch (error) {
      console.log(error)
      console.log("DBLogic함수 try-catch error ")
    }
  })
}


app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {

    try {
      await installExtension(VUEJS_DEVTOOLS);
      //vue 속성
      await installVueDevtools();
    } catch (e: any) {
      console.error("Vue Devtools failed to install:", e.toString());

    }
  }
  createWindow();
  getDB();
  //clearTable('UserStorage')



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


app.on("browser-window-blur", () => {
  console.log("blur")
})

app.on("browser-window-focus", () => {
  console.log("focus")
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
  console.log("activate!!!!")
  console.log("activate!!!!")

  console.log("activate!!!!")

  console.log("activate!!!!")

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


