import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu } from 'electron'
import * as fs from 'fs';
import path, { join } from 'path'
import { readFileSync, writeFileSync, existsSync, createWriteStream, createReadStream } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import logoUrl from '../../resources/logo.ico?asset'
import { execute, initializeDatabase, runMigrate } from './db'
import jwt from 'jsonwebtoken'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, unlink } from 'fs/promises'
import dotenv from 'dotenv';
const nodemailer = require("nodemailer");

let transporter: any = null;
dotenv.config();

const toBoolean = (value: string | undefined): boolean => {
  return value === 'true';
};
const DEFAULT_EMAIL_SETTINGS = {
  smtpServer: process.env.SMTP_SERVER as string,
  smtpPort: process.env.SMTP_PORT as string,
  smtpSecure: toBoolean(process.env.SMTP_SECURE),
  smtpUsername: process.env.SMTP_USERNAME as string,
  smtpPassword: process.env.SMTP_PASSWORD as string,
  smtpTLS: toBoolean(process.env.SMTP_TLS),
  emailFrom: process.env.EMAIL_FROM as string,
};

function initializeEmailTransporter(config: Config) {
  const transporterConfig: any = {
    host: config.smtpServer,
    port: parseInt(config.smtpPort),
    secure: config.smtpSecure,
    auth: config.smtpUsername && config.smtpPassword
      ? { user: config.smtpUsername, pass: config.smtpPassword }
      : undefined,
  };

  if (!config.smtpTLS) {
    transporterConfig.tls = {
      rejectUnauthorized: config.smtpTLS,
    };
  }

  transporter = nodemailer.createTransport(transporterConfig);
}


// IPC handler for sending email
ipcMain.handle('send-email', async (_event, mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, response: info.response };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: (error as Error).message };
  }
});
/*
import { db } from './db'
import { machines} from './schema'
import { sql, and, lte, gte } from 'drizzle-orm'
*/
const execAsync = promisify(exec);
const SECRET_KEY = 'GeaHWfni2hvXkdM4NdotDKqnHgIrwkRO';
const CONFIG_PATH = join(app.getPath('userData'), 'config.json');
let tray: Tray | null = null;
let databasePath: string | null = null;
let uploadFolderPath: string | null = null;
let isQuiting = false;

/*
const getUpcomingCalibrations = async () => {
  // Get the current timestamp and calculate the timestamp for 10 days from now
  const now = new Date();
  const tenDaysFromNow = now.getTime() + 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
  console.log('Now:', now, '10 days from now:', new Date(tenDaysFromNow));
  // Perform the query to get machines with upcoming calibrations within the next 10 days
  if (!db) {
    throw new Error('Database is not initialized');
  }

  const result = await db
    .select({name: machines.name,nextDate: machines.nextCalibrationDate})
    .from(machines)
    .where(and(lte(machines.nextCalibrationDate, new Date(tenDaysFromNow))
    ,gte(machines.nextCalibrationDate,now)))
    .execute();
  console.log(result);
  return result;
};

const NOTIFICATION_TITLE = 'Upcoming Calibration'


const showNotification = (machineName: string, calibrationDate: number) => {
  // Convert timestamp to a Date object and format it
  const date = new Date(calibrationDate);
  const formattedDate = date.toLocaleDateString(); // Format the date as desired

  const notificationBody = `Machine ${machineName} has a calibration due on ${formattedDate}.`;
  
  const notification = new Notification({title: NOTIFICATION_TITLE, 
    body: notificationBody,
    icon: logoUrl
  });
  notification.show();
  notification.on('click', () => {
    console.log('Notification clicked');
  });

};

const checkCalibrationsPeriodically = () => {
  setInterval(async () => {
    try {
      const calibrations = await getUpcomingCalibrations()
      calibrations.forEach(machine => {
        if (machine.nextDate) {
          showNotification(machine.name, machine.nextDate.getTime());
        }
      });
    } catch (error) {
      console.error('Failed during periodic calibration check:', error)
    }
  }, 60000) // 60 seconds interval
}
*/
async function getUNCPath(filePath: string): Promise<string> {
  const driveLetter = filePath.substr(0, 2);

  try {
    const { stdout } = await execAsync(`net use ${driveLetter}`);

    const regexPatterns = [
      /Remote name\s+(.+)/i,  // English
      /Nom distant\s+(.+)/i,  // French
      /Remotename\s+(.+)/i,   // German
      /Nombre remoto\s+(.+)/i // Spanish
    ];

    for (const regex of regexPatterns) {
      const match = stdout.match(regex);
      if (match && match[1]) {
        const uncRoot = match[1].trim();
        const relativePath = filePath.substr(2);
        return `${uncRoot}${relativePath}`;
      }
    }
  } catch (error) {
    // If the command fails, it's likely a local drive, so we return the original path
    console.log(`Unable to get UNC path for ${filePath}, assuming local drive`);
  }

  return filePath;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: logoUrl,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  });

  mainWindow.setMinimumSize(900, 670);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  await runMigrate();
}
async function loadConfig(): Promise<Config> {
  if (existsSync(CONFIG_PATH)) {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return {
      ...DEFAULT_EMAIL_SETTINGS,
      ...config
    };
  }
  return {
    databasePath: null,
    uploadFolderPath: null,
    ...DEFAULT_EMAIL_SETTINGS
  };
}

interface Config {
  databasePath: string | null;
  uploadFolderPath: string | null;
  smtpServer: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  smtpTLS: boolean;
  emailFrom: string;
}



async function saveConfig(config: Config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config), 'utf-8');
}



app.whenReady().then(async () => {
  const config = await loadConfig();
  databasePath = config.databasePath;
  uploadFolderPath = config.uploadFolderPath;

  if (!databasePath) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Database File',
      filters: [{ name: 'Database Files', extensions: ['db'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) {
      app.quit();
      return;
    }

    databasePath = await getUNCPath(filePaths[0]);
    config.databasePath = databasePath;
  }
  if (!uploadFolderPath) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Document Folder',
      properties: ['openDirectory'],
    });

    if (canceled || filePaths.length === 0) {
      app.quit();
      return;
    }

    const documentPath = await getUNCPath(filePaths[0]);
    config.uploadFolderPath = documentPath;
  }

  await saveConfig(config);

  (global as any).databasePath = databasePath;
  (global as any).uploadFolderPath = uploadFolderPath;

  initializeEmailTransporter(config);

  try {
    await initializeDatabase();
    await createWindow();
    await runMigrate();
  } catch (error) {
    console.error('Error during initialization:', error);
    dialog.showErrorBox('Initialization Error', `Failed to initialize the application: ${(error as Error).message}`);
    app.quit();
  }
  electronApp.setAppUserModelId('com.electron');

  // Initialize the tray icon
  tray = new Tray(logoUrl);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows[0].show(); // Show the existing window
        } else {
          createWindow(); // Create a new window if none exists
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true; // Set a flag to indicate quitting
        app.quit(); // Quit the application
      }
    }
  ]);
  tray.setToolTip('Your Electron App');
  tray.setContextMenu(contextMenu);

  // Restore the window from the tray icon click
  tray.on('click', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].show(); // Show the existing window
    } else {
      createWindow(); // Create a new window if none exists
    }
  });

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));
  ipcMain.handle('db:execute', execute);

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});
ipcMain.handle('get-config', () => {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return config;
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
});

ipcMain.handle('set-config', async (_, newConfig) => {
  try {
    await saveConfig(newConfig);

    // Check if the database path has changed
    if (newConfig.databasePath !== databasePath) {
      databasePath = newConfig.databasePath;
      (global as any).databasePath = databasePath;

      // Reinitialize the database with the new path
      try {
        await initializeDatabase();
        await runMigrate();
        // Notify renderer that database has been updated
        BrowserWindow.getAllWindows().forEach(window =>
          window.webContents.send('database-updated', databasePath)
        );
      } catch (error) {
        console.error('Error reinitializing database:', error);
        dialog.showErrorBox('Database Error', `Failed to connect to the new database: ${(error as Error).message}`);
        return false;
      }
    }
  initializeEmailTransporter(newConfig);
    return true;
  } catch (error) {
    console.error('Error writing config:', error);
    return false;
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  } else {
    try {
      const path = await getUNCPath(result.filePaths[0]);
      return path;
    } catch (error) {
      console.error('Error getting UNC path:', error);
      return result.filePaths[0]; // Return the original path if there's an error
    }
  }
});

ipcMain.handle('upload-file', async (_event, sourcePath, destinationPath) => {

  return new Promise((resolve, reject) => {
    const readStream = createReadStream(sourcePath);
    const writeStream = createWriteStream(destinationPath);

    readStream.on('error', (error) => {
      console.error('Read stream error:', error);
      reject(error);
    });
    writeStream.on('error', (error) => {
      console.error('Write stream error:', error);
      reject(error);
    });
    writeStream.on('finish', () => {
      console.log('File upload completed');
      resolve(destinationPath); // Resolve with destinationPath instead of true
    });

    readStream.pipe(writeStream);
  });
});

ipcMain.handle('delete-file', async (_event, filePath) => {
  try {
    await unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file:', error);
    return { success: false, error: (error as any).message };
  }
});


ipcMain.handle('get-files', async (_event, directoryPath) => {
  try {
    const files = await readdir(directoryPath);
    return files.map(file => ({
      name: file,
      path: path.join(directoryPath, file)
    }));
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('open-file', async (_event, path) => {
  try {
    await shell.openPath(path);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to open file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-pdf', async (_event, filePath: string, pdfBuffer: ArrayBuffer) => {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    await fs.promises.mkdir(directory, { recursive: true });

    // Write the PDF file
    await fs.promises.writeFile(filePath, Buffer.from(pdfBuffer));

    return { success: true, message: 'PDF saved successfully' };
  } catch (error: any) {
    console.error('Error saving PDF:', error);
    return { success: false, message: 'Failed to save PDF', error: error.message };
  }
});

ipcMain.handle('generate-token', (_, id: number, username: string, admin: boolean, ticketPermissions: boolean) => {
  try {
    const token = jwt.sign(
      { id, username, admin, ticketPermissions },
      SECRET_KEY,
      { expiresIn: '1h' }
    )
    return token
  } catch (error) {
    console.error('Token generation failed:', error)
    throw error
  }
})

ipcMain.handle('quit-app', () => {
  isQuiting = true;
  app.quit();
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Database Files', extensions: ['db'] }]
  });

  if (result.canceled) {
    return null;
  } else {
    try {
      const path = await getUNCPath(result.filePaths[0]);
      return path;
    } catch (error) {
      console.error('Error getting UNC path:', error);
      return result.filePaths[0]; // Return the original path if there's an error
    }
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})