"use strict";


/**electron 렌더러 프로세스 생성 -> BrowserWindow객체 사용**/
import { app, protocol, BrowserWindow, webContents } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

//const log = require('electron-log');

const { localStorage } = require('electron-browser-storage');


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

  win.webContents.executeJavaScript('localStorage.getItem("loglevel:webpack-dev-server");', true)
    .then(result => {
      console.log("createWindow:")
      console.log(JSON.stringify(result))
    });

  console.log("createWindow id?  " + win.id);
  return win;
}


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
    //Install Vue Devtools
    // localStorage.getItem("loglevel:webpack-dev-server").then((data: any) => {
    //   console.log("@@@")
    //   console.log(data);
    // })

    try {
      await installExtension(VUEJS_DEVTOOLS);
      //vue 속성
      await installVueDevtools();
    } catch (e: any) {
      console.error("Vue Devtools failed to install:", e.toString());

    }
  }
  createWindow();



  //객체의 주소나 위에서 생성
  // const leng = BrowserWindow.getAllWindows().length
  // const win1_0 = BrowserWindow.getAllWindows()[0]
  //const win1_1 = BrowserWindow.getAllWindows()[1]

  BrowserWindow.getAllWindows().forEach((element: BrowserWindow) => {

    element.webContents.executeJavaScript('localStorage.key(0);', true)
      .then(result => {
        if (result == "loglevel:webpack-dev-server") {
          element.webContents.executeJavaScript('localStorage.getItem("loglevel:webpack-dev-server");', true)
            .then(result => {
              console.log("app ready:")
              console.log(JSON.stringify(result))
            });
        }
      });

  });





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
