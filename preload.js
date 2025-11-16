// preload.js
const { contextBridge, ipcRenderer } = require("electron");
const { version } = require("./package.json");

contextBridge.exposeInMainWorld("electronAPI", {
  broadcastPrompt: (prompt) => ipcRenderer.send("broadcast-prompt", prompt),
  onReloadAllPanels: (callback) => {
    ipcRenderer.on("reload-all-panels", () => callback());
  },
  onMenuSendPrompt: (callback) => {
    ipcRenderer.on("menu-send-prompt", () => callback());
  }
});

// App-Infos (z. B. Version) für den Renderer
contextBridge.exposeInMainWorld("appInfo", {
  version
});