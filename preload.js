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
  updateSettings: (settings) => ipcRenderer.invoke("update-settings", settings),
  onSettingsUpdated: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on("settings-updated", listener);
    return () => ipcRenderer.removeListener("settings-updated", listener);
  },
});
