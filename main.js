// main.js
const { app, BrowserWindow, ipcMain, webContents, Menu, dialog } = require("electron");
const path = require("path");
const { version } = require("./package.json");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 1000,
    title: `Multi-AI Browser v${version}`,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Meta-Prompt empfangen und an alle WebViews senden
ipcMain.on("broadcast-prompt", async (event, prompt) => {
  if (!mainWindow) return;

  const allContents = webContents.getAllWebContents();

  for (const wc of allContents) {
    const url = wc.getURL ? wc.getURL() : "";
    // unsere eigene App (file://) ignorieren
    if (!url || url.startsWith("file://")) continue;

    try {
      await wc.executeJavaScript(`
        (function () {
          const promptText = ${JSON.stringify(prompt)};

          // 1) Eingabefeld suchen (textarea, contenteditable, input)
          function findInput() {
            const candidates = [];

            candidates.push(...document.querySelectorAll('textarea'));
            candidates.push(...document.querySelectorAll('div[contenteditable="true"]'));
            candidates.push(...document.querySelectorAll('input[type="text"], input[type="search"]'));

            // nur sichtbare Elemente
            const visible = candidates.filter(el => el && el.offsetParent !== null);

            if (visible.length === 0) {
              return null;
            }

            // meistens ist das letzte sichtbare Feld das Chat-Eingabefeld
            return visible[visible.length - 1];
          }

          const el = findInput();

          if (!el) {
            console.warn("Multi-AI-Browser: kein Eingabefeld gefunden");
            return "no-input-found";
          }

          // 2) Text setzen
          if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
            el.value = promptText;
          } else {
            el.innerText = promptText;
          }

          // 3) Input-Event auslösen (wichtig für React/Vue/SPA)
          const inputEvent = new InputEvent("input", { bubbles: true });
          el.dispatchEvent(inputEvent);

          // 4) Enter simulieren (viele Chat-UIs senden damit ab)
          const keyDown = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          el.dispatchEvent(keyDown);

          const keyUp = new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          el.dispatchEvent(keyUp);

          return "ok";
        })();
      `);
    } catch (err) {
      console.error("Error broadcasting prompt to webview:", url, err);
    }
  }
});

app.whenReady().then(() => {
  createWindow();


  const template = [
    {
      label: "Multi-AI Browser",
      submenu: [
        {
          label: `About Multi-AI Browser`,
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "About",
              message: `Multi-AI Browser\nVersion: ${version}`
            });
          }
        },
        { type: "separator" },
        { role: "quit", label: "Exit" }
      ]
    },
    {
      label: "Actions",
      submenu: [
        {
          label: "Send Prompt to All",
          accelerator: "Ctrl+Enter",
          click: () => {
            if (BrowserWindow.getAllWindows().length > 0) {
              BrowserWindow.getAllWindows()[0]
                .webContents.send("menu-send-prompt");
            }
          }
        },
        {
          label: "Reload All Panels",
          accelerator: "Ctrl+Shift+R",
          click: () => {
            if (BrowserWindow.getAllWindows().length > 0) {
              BrowserWindow.getAllWindows()[0]
                .webContents.send("reload-all-panels");
            }
          }
        }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen", label: "Toggle Full Screen" }
      ]
    },
    {
      label: "Developer",
      submenu: [
        { role: "reload", label: "Reload Window" },
        { role: "toggleDevTools", label: "Toggle DevTools" }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});
