// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  broadcastPrompt: (prompt) => ipcRenderer.send("broadcast-prompt", prompt)
});
