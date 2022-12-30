"use strict";


/**electron 렌더러 프로세스 생성 -> BrowserWindow객체 사용**/
import { app, protocol, BrowserWindow, webContents } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

const isDevelopment = process.env.NODE_ENV !== "production";

const db = require('electron-db');

let dataBahnWindow: BrowserWindow;


//const location = path.join(__dirname, 'mydb.json')

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
function changeValue() {

}
//DB내 정보 출력 함수
function getDB() {
  db.getAll('UserStorage', (succ: any, data: any) => {
    console.log("DB에 저장된 data:  " + JSON.stringify(data))
  })
}

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

app.on("before-quit", async () => {
  console.log("before-quit 진입")

  type MyObject = {
    key: string,
    value: string,
  }

  const obj: MyObject = {
    key: "pet",
    value: "null",
  }

  console.log(dataBahnWindow)
  dataBahnWindow.webContents.executeJavaScript('localStorage.length;', true)
    .then(result => {
      console.log(result)
      for (let i = 0; i < result; i++) {
        let keys: string;
        dataBahnWindow.webContents.executeJavaScript('localStorage.key(' + i + ')', true)
          .then(result => {
            keys = result;
            console.log(keys)
            if (keys == "pet") {
              console.log("if문안에 들어왔는지?? ")
              // dataBahnWindow.webContents.executeJavaScript('localStorage.getItem("pet");', true)
              //   .then(result => {
              //     //obj.value = result;
              //     console.log(result)
              //     console.log("app ready: getting value. . .")
              //     console.log(JSON.stringify(result))


              //     if (validDB('UserStorages')) {
              //       console.log("DB존재합니다 insert시작. . .")
              //       //insertDB('UserStorage', obj);
              //     }
              //     else {
              //       console.log("DB존재하지 않습니다. create시작. . .")
              //       createDB('UserStorages');
              //       //insertDB('UserStorages', obj);
              //     }

              //     //deleteRecords(1672362891330);

              //   });
            }
          })

      }


    });

  // console.log(keys)
  // console.log(JSON.stringify(keys))
  // BrowserWindow.getAllWindows().forEach((element: BrowserWindow, index: number) => {
  //   dataBahnWindow.webContents.executeJavaScript('localStorage.key()', true)

  //   type MyObject = {
  //     key: string,
  //     value: string,
  //   }

  //   const obj: MyObject = {
  //     key: "pet",
  //     value: "null",
  //   }


  //   //`localStorage.key(${a})`
  //   element.webContents.executeJavaScript('localStorage.key(0);', true)
  //     .then(result => {
  //       if (result == "pet") {

  //         element.webContents.executeJavaScript('localStorage.getItem("pet");', true)
  //           .then(result => {
  //             obj.value = result;
  //             console.log("app ready: getting value. . .")
  //             console.log(JSON.stringify(result))


  //             if (validDB('UserStorages')) {
  //               console.log("DB존재합니다 insert시작. . .")
  //               insertDB('UserStorage', obj);
  //             }
  //             else {
  //               console.log("DB존재하지 않습니다. create시작. . .")
  //               createDB('UserStorages');
  //               insertDB('UserStorages', obj);
  //             }

  //             //deleteRecords(1672362891330);

  //           });
  //       }
  //     });


  // });

  //console.log(BrowserWindow.getAllWindows())

})
// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();

  }
});

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


  // dataBahnWindow.webContents.executeJavaScript('localStorage.getItem("pet");', true)
  //   .then(result => {
  //     console.log(result)
  //   });

  //객체의 주소나 위에서 생성
  // const leng = BrowserWindow.getAllWindows().length
  // const win1_0 = BrowserWindow.getAllWindows()[0]
  //const win1_1 = BrowserWindow.getAllWindows()[1]

  // BrowserWindow.getAllWindows().forEach((element: BrowserWindow) => {
  //   type MyObject = {
  //     key: string,
  //     value: string,
  //   }

  //   const obj: MyObject = {
  //     key: "pet",
  //     value: "null",
  //   }


  //   element.webContents.executeJavaScript('localStorage.key(0);', true)
  //     .then(result => {
  //       if (result == "pet") {
  //         element.webContents.executeJavaScript('localStorage.getItem("pet");', true)
  //           .then(result => {
  //             obj.value = result;
  //             console.log("app ready: getting value. . .")
  //             console.log(JSON.stringify(result))


  //             if (validDB('UserStorages')) {
  //               console.log("DB존재합니다 insert시작. . .")
  //               insertDB('UserStorage', obj);
  //             }
  //             else {
  //               console.log("DB존재하지 않습니다. create시작. . .")
  //               createDB('UserStorages');
  //               insertDB('UserStorages', obj);
  //             }

  //             //deleteRecords(1672362891330);

  //           });
  //       }
  //     });


  // });




  //value값 출력
  // win1_0.webContents.executeJavaScript('localStorage.getItem("loglevel:webpack-dev-server");', true)
  //   .then(result => {
  //     console.log("app ready:")
  //     console.log(JSON.stringify(result))
  //   });
  // console.log("ready id?  " + win1_0.id);

  //key값 출력
  // win1_0.webContents.executeJavaScript('localStorage.key(0);', true)
  //   .then(result => {
  //     console.log("app ready:")
  //     console.log(result)
  //   });





});

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
