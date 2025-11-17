// preload.js
const { contextBridge, ipcRenderer } = require("electron");
const { version } = require("./package.json");
const { panels } = require("./config");

contextBridge.exposeInMainWorld("electronAPI", {
  broadcastPrompt: (prompt) => ipcRenderer.send("broadcast-prompt", prompt),
  onReloadAllPanels: (callback) => {
    ipcRenderer.on("reload-all-panels", () => callback());
  },
  onMenuSendPrompt: (callback) => {
    ipcRenderer.on("menu-send-prompt", () => callback());
  }
});

// App-Infos (z. B. Version) fuer den Renderer
contextBridge.exposeInMainWorld("appInfo", {
  version
});

// Panel-Konfiguration fuer den Renderer bereitstellen
contextBridge.exposeInMainWorld("panelConfig", {
  panels
});
