const Store = require("electron-store");

const store = new Store({
  defaults: {
    figmaLinks: [],
    filePaths: [],
    customPresets: [],
    promptHistory: [],
    preferences: {
      editorMode: "raw",
      activePanel: "presets",
      windowBounds: { width: 1200, height: 800 },
    },
  },
});

module.exports = store;
