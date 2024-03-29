import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { URL } from 'url';

const isSingleInstance = app.requestSingleInstanceLock();
const isDevelopment = import.meta.env.MODE === 'development';

if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}

app.disableHardwareAcceleration();

// Install "React.js devtools"
if (import.meta.env.MODE === 'development') {
  app
    .whenReady()
    .then(() => import('electron-devtools-installer'))
    .then(({ default: installExtension, REACT_DEVELOPER_TOOLS }) =>
      installExtension(REACT_DEVELOPER_TOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    )
    .catch((e) => console.error('Failed install extension:', e));
}

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false, // Use 'ready-to-show' event to show window
    webPreferences: {
      nativeWindowOpen: true,
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like iframe or Electron's BrowserView. https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: import.meta.env.MODE !== 'test', // Spectron tests can't work with contextIsolation: true
      // enableRemoteModule: import.meta.env.MODE === 'test', // Spectron tests can't work with enableRemoteModule: false
    },
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();

    // if (isDevelopment) {
    //   mainWindow?.webContents.openDevTools();
    // }
    mainWindow?.webContents.openDevTools();

  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl =
    import.meta.env.MODE === 'development' &&
    import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL(
          '../dist/renderer/index.html',
          'file://' + __dirname,
        ).toString();

  await mainWindow.loadURL(pageUrl);
};

app.on('web-contents-created', (_event, contents) => {

  /**
   * Block navigation to origins not on the allowlist.
   *
   * Navigation is a common attack vector. If an attacker can convince the app to navigate away
   * from its current page, they can possibly force the app to open web sites on the Internet.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
   */
  contents.on('will-navigate', (event, url) => {
    const allowedOrigins : ReadonlySet<string> =
      new Set<`https://${string}`>(); // Do not use insecure protocols like HTTP. https://www.electronjs.org/docs/latest/tutorial/security#1-only-load-secure-content
    const { origin, hostname } = new URL(url);
    const isDevLocalhost = isDevelopment && hostname === 'localhost'; // permit live reload of index.html
    if (!allowedOrigins.has(origin) && !isDevLocalhost){
      console.warn('Blocked navigating to an unallowed origin:', origin);
      event.preventDefault();
    }
  });

  /**
  * Hyperlinks to allowed sites open in the default browser.
  *
  * The creation of new `webContents` is a common attack vector. Attackers attempt to convince the app to create new windows,
  * frames, or other renderer processes with more privileges than they had before; or with pages opened that they couldn't open before.
  * You should deny any unexpected window creation.
  *
  * @see https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
  * @see https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-openexternal-with-untrusted-content
  */
  contents.setWindowOpenHandler(({ url }) => {
    const allowedOrigins : ReadonlySet<string> =
      new Set<`https://${string}`>([ // Do not use insecure protocols like HTTP. https://www.electronjs.org/docs/latest/tutorial/security#1-only-load-secure-content
      'https://vitejs.dev',
      'https://github.com',
      'https://v3.vuejs.org']);
    const { origin } = new URL(url);
    if (allowedOrigins.has(origin)){
      shell.openExternal(url);
    } else {
      console.warn('Blocked the opening of an unallowed origin:', origin);
    }
    return { action: 'deny' };
  });

  /**
   * Block requested permissions not on the allowlist.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
   */
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const origin = new URL(webContents.getURL()).origin;
    const allowedOriginsAndPermissions : Map<string, Set<string>> =
      new Map<`https://${string}`, Set<string>>([
        //['https://permission.site', new Set(['notifications', 'media'])],
      ]);
    if (allowedOriginsAndPermissions.get(origin)?.has(permission)) {
      callback(true);
    } else {
      console.warn(`${origin} requested permission for '${permission}', but was blocked.`);
      callback(false);
    }
  });

  /**
   * Verify webview options before creation
   *
   * Strip away preload scripts, disable Node.js integration, and ensure origins are on the allowlist.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#12-verify-webview-options-before-creation
   */
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    // @ts-expect-error `preloadURL` exists - see https://www.electronjs.org/docs/latest/api/web-contents#event-will-attach-webview
    delete webPreferences.preloadURL;

    webPreferences.nodeIntegration = false;
    const { origin } = new URL(params.src);
    const allowedOrigins : ReadonlySet<string> =
      new Set<`https://${string}`>(); // Do not use insecure protocols like HTTP. https://www.electronjs.org/docs/latest/tutorial/security#1-only-load-secure-content
    if (!allowedOrigins.has(origin)) {
      console.warn(`A webview tried to attach ${params.src}, but was blocked.`);
      event.preventDefault();
    }
  });
});


app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app
  .whenReady()
  .then(createWindow)
  .catch((e) => console.error('Failed create window:', e));


// Auto-updates
if (import.meta.env.PROD) {
  app.whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error('Failed check updates:', e));
}

