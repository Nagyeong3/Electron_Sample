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
  db.deleteRow('UserStorage', { "id": id }, (succ: any) => {
    console.log("data delete complete??")
  })
}

//DBTable삭제 함수
function clearTable(DBName: string) {
  db.clearTable(DBName, (succ: any) => {
    if (succ)
      console.log("clear success")
    getDB();
  })
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
    // win.loadURL("https://dev.data-bahn.com");
    if (!process.env.IS_TEST) win.webContents.openDevTools();


  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");

  }

  dataBahnWindow = win;

}

app.on("before-quit", () => {
  console.log("before quit")
  let length = 0;

  type MyObject = {
    key: string,
    value: string,
  }

  const obj: MyObject = {
    key: "pet",
    value: "null",
  }

  let where = { 'key': 'pet' }
  let set = { 'value': 'dogg' }
  // const leng = BrowserWindow.getAllWSindows().length
  console.log("a")

  const test = dataBahnWindow.webContents;
  console.log("test : " + test)

  // console.log("win1_0 : " + JSON.stringify(win1_0))
  // console.log("win1_0 webcontents : " + JSON.stringify(win1_0.webContents))

  dataBahnWindow.webContents.executeJavaScript('localStorage.length', true)
    .then(result => {
      //console.log("c")
      console.log(result)
      length = result;
    })
  //  console.log(db.getAllkeys());
  dataBahnWindow.webContents.executeJavaScript('Object.keys(localStorage)', true)
    .then(result => {
      // console.log(JSON.stringify(result))
      // console.log(result)
      let str = JSON.stringify(result)
      let splitted = str.split('[')
      let i = 0;
      //for (let i = 0; i < 5; i++) {

      //}
      while (1) {
        let s = splitted[1].split('"')

        // console.log(s)
        if (s[i] == "pet") {
          dataBahnWindow.webContents.executeJavaScript('localStorage.getItem("pet");', true)
            .then(result => {
              obj.value = result;
              // console.log("1");
              console.log(JSON.stringify(result))

              if (validDB('UserStorages')) {
                console.log("DB존재합니다 insert시작. . .")
                insertDB('UserStorage', obj);
                changeValue('UserStorage', where, set)
              }
              else {
                console.log("DB존재하지 않습니다. create시작. . .")
                createDB('UserStorages');
                insertDB('UserStorages', obj);
                changeValue('UserStorage', where, set)
              }

            })
          return 0;

        } else {
          // console.log("2");
          console.log(s[i])
          i++;
        }
        if (i == length * 2 + 1) {
          // console.log("3");
          console.log("해당키 없음")
          return 0;
        }

      }
      //console.log(splitted)
      // let str = result.split(',', 2)
      // console.log();
    });





  //getAllkeys()
  // result 에 key 배열
  //result.foreach( (key: any) => { if key == pet { logic() }}})

  // dataBahnWindow.webContents.executeJavaScript('localStorage.length;', true)
  //   .then(result => {
  //     console.log(result)
  //     for (let i = 0; i < result; i++) {
  //       let keys: string;
  //       dataBahnWindow.webContents.executeJavaScript('localStorage.key(' + i + ')', true)
  //         .then(result => {
  //           keys = result;
  //           console.log(keys)



  //         })

  //     }


  //   });
})
// Quit when all windows are closed.
app.on("window-all-closed", () => {


  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //console.log(dataBahnWindow)
  if (process.platform !== "darwin") {
    app.quit();

  }
});

function DBLogic() {
  let length = 0;

  // const leng = BrowserWindow.getAllWSindows().length
  const win1_0 = BrowserWindow.getAllWindows()[0]
  //const win1_1 = BrowserWindow.getAllWindows()[1]
  dataBahnWindow.webContents.executeJavaScript('localStorage.length;', true)
    .then(result => {
      console.log(result)
      length = result;
    })
  //  console.log(db.getAllkeys());
  dataBahnWindow.webContents.executeJavaScript('Object.keys(localStorage)', true)
    .then(result => {
      // console.log(JSON.stringify(result))
      console.log(result)
      let str = JSON.stringify(result)
      let splitted = str.split('[')
      let i = 0;

      while (1) {
        let s = splitted[1].split('"')

        // console.log(s)
        if (s[i] == "pet") {
          console.log(s[i])
          return 0;

        } else {

          console.log(s[i])
          i++;
        }
        if (i == length * 2 + 1) {
          console.log("해당키 없음")
          return 0;
        }

      }

      //console.log(splitted)
      // let str = result.split(',', 2)
      // console.log();
    });
}

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

  const win1_0 = BrowserWindow.getAllWindows()[0]

  // dataBahnWindow.webContents.addListener

});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.


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
  clearTable('UserStorage')
  let length = 0;

  // const leng = BrowserWindow.getAllWSindows().length
  const win1_0 = BrowserWindow.getAllWindows()[0]
  //const win1_1 = BrowserWindow.getAllWindows()[1]
  win1_0.webContents.executeJavaScript('localStorage.length;', true)
    .then(result => {
      console.log(result)
      length = result;
    })
  //  console.log(db.getAllkeys());
  win1_0.webContents.executeJavaScript('Object.keys(localStorage)', true)
    .then(result => {
      // console.log(JSON.stringify(result))
      console.log(result)
      let str = JSON.stringify(result)
      let splitted = str.split('[')
      let i = 0;

      while (1) {
        let s = splitted[1].split('"')

        // console.log(s)
        if (s[i] == "pet") {
          console.log(s[i])
          return 0;

        } else {

          console.log(s[i])
          i++;
        }
        if (i == length * 2 + 1) {
          console.log("해당키 없음")
          return 0;
        }

      }

      //console.log(splitted)
      // let str = result.split(',', 2)
      // console.log();
    });


  //win1_0.webContents.executeJavaScript('window.addEventListener("storage",()=>{window.alert(Object.keys(localStorage)); return Object.keys(localStorage)  })').then((result) => { })

})




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


