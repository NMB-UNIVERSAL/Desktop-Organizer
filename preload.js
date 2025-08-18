const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  createWidget: (type, options) =>
    ipcRenderer.invoke("create-widget", type, options),
  getWidgetInfo: () => ipcRenderer.invoke("get-widget-info"),
  closeWidget: (widgetId) => ipcRenderer.invoke("close-widget", widgetId),
  closeApp: () => ipcRenderer.invoke("close-app"),
  // Storage methods
  saveData: (key, data) => ipcRenderer.invoke("save-data", { key, data }),
  loadData: (key) => ipcRenderer.invoke("load-data", { key }),
});
