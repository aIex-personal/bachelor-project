'use strict';

/**
 * Electron main process — HapticStudio Desktop
 *
 * Dev mode (ELECTRON_DEV=1):  loads from Vite dev server at http://localhost:5173
 * Prod mode:                  serves the SvelteKit static build via a custom
 *                             app:// protocol so that absolute asset paths
 *                             (/_app/...) resolve correctly without a web server.
 */

const { app, BrowserWindow, session, Menu, shell, protocol, net } = require('electron');
const path = require('path');
const url  = require('url');
const fs   = require('fs');

const isDev = process.env.ELECTRON_DEV === '1' || !app.isPackaged;

// ── Custom protocol ───────────────────────────────────────────────────────────
// Must be registered before app is ready.
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'app',
		privileges: {
			standard:            true,  // enables standard URL semantics
			secure:              true,  // treated as secure origin (needed for Web APIs)
			allowServiceWorkers: false,
			supportFetchAPI:     true,
			corsEnabled:         true,
		}
	}
]);

// ── Window factory ────────────────────────────────────────────────────────────

function createWindow(appBase) {
	const win = new BrowserWindow({
		width:    1440,
		height:   900,
		minWidth: 1024,
		minHeight: 640,
		title: 'HapticStudio',
		backgroundColor: '#1d232a', // matches DaisyUI "night" base-100
		webPreferences: {
			preload:          path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration:  false,
		}
	});

	// ── Permissions ──────────────────────────────────────────────────────────
	// Grant audio enumeration & media access so that:
	//   • navigator.mediaDevices.enumerateDevices() returns labelled devices
	//   • AudioContext.setSinkId() can switch output devices
	session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
		const allowed = ['media', 'audioCapture', 'mediaKeySystem'];
		callback(allowed.includes(permission));
	});

	session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
		const allowed = ['media', 'audioCapture', 'mediaKeySystem'];
		return allowed.includes(permission);
	});

	// ── Load app ─────────────────────────────────────────────────────────────
	if (isDev) {
		win.loadURL('http://localhost:5173').catch(() => {
			setTimeout(() => win.loadURL('http://localhost:5173'), 1500);
		});
		win.webContents.openDevTools({ mode: 'detach' });
	} else {
		// Serve via app:// so absolute asset refs (/_app/...) resolve correctly
		win.loadURL('app://./');
	}

	// ── External links open in the system browser ─────────────────────────────
	win.webContents.setWindowOpenHandler(({ url: u }) => {
		if (u.startsWith('http://') || u.startsWith('https://')) {
			shell.openExternal(u);
		}
		return { action: 'deny' };
	});

	return win;
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
	// Resolve the directory that holds the SvelteKit static build
	const appBase = path.resolve(
		app.isPackaged
			? path.join(process.resourcesPath, 'app')
			: path.join(__dirname, '..', 'project', 'build')
	);

	// Register the app:// file-serving protocol
	protocol.handle('app', async (req) => {
		try {
			const { pathname } = new URL(req.url);
			// Strip leading slash; empty path → 'index.html'
			const relative = decodeURIComponent(pathname).replace(/^\//, '') || 'index.html';
			const resolved  = path.resolve(appBase, relative);

			// Security: block path traversal outside appBase
			if (!resolved.startsWith(appBase + path.sep) && resolved !== appBase) {
				return new Response('Forbidden', { status: 403 });
			}

			if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
				return net.fetch(url.pathToFileURL(resolved).toString());
			}

			// SPA fallback — all unmatched paths serve index.html
			return net.fetch(url.pathToFileURL(path.join(appBase, 'index.html')).toString());
		} catch {
			return new Response('Internal error', { status: 500 });
		}
	});

	Menu.setApplicationMenu(buildMenu());
	createWindow(appBase);

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow(appBase);
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

// ── Application menu ──────────────────────────────────────────────────────────

function buildMenu() {
	const isMac = process.platform === 'darwin';

	const template = [
		...(isMac ? [{ role: 'appMenu' }] : []),
		{ role: 'fileMenu' },
		{ role: 'editMenu' },
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ role: 'toggleDevTools' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{ role: 'windowMenu' }
	];

	return Menu.buildFromTemplate(template);
}
