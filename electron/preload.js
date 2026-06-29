'use strict';

/**
 * Electron preload — context bridge.
 *
 * Exposed as window.electronAPI in the renderer (SvelteKit app).
 * Keep this surface minimal; heavy IPC belongs in separate handlers.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	/** True when running inside the Electron shell */
	isElectron: true,

	/** 'darwin' | 'win32' | 'linux' */
	platform: process.platform,
});
