const { Menu, dialog, ipcMain } = require('electron');

function createMenu(mainWindow, getStore) {
  const store = getStore();
  const currentLang = store.get('language') || 'zh-CN';

  function t(key) {
    const translations = {
      'zh-CN': {
        'menu.file': '文件',
        'menu.file.open-files': '打开文件...',
        'menu.file.open-folder': '打开文件夹...',
        'menu.file.import-playlist': '导入播放列表...',
        'menu.file.export-playlist': '导出播放列表...',
        'menu.playback': '播放',
        'menu.playback.play-pause': '播放 / 暂停',
        'menu.playback.next': '下一首',
        'menu.playback.previous': '上一首',
        'menu.playback.volume-up': '增大音量',
        'menu.playback.volume-down': '减小音量',
        'menu.view': '视图',
        'menu.view.mini-player': '切换迷你播放器',
        'menu.view.theme': '切换深色/浅色主题',
        'menu.view.language': '语言 / Language',
        'menu.help': '帮助',
        'menu.help.about': '关于音乐播放器',
        'menu.help.about.title': '音乐播放器 v1.0.0',
        'menu.help.about.detail': '一个基于 Electron 的本地音乐播放器。\n支持 MP3、FLAC、WAV、AAC、OGG 等格式。',
      },
      'en': {
        'menu.file': 'File',
        'menu.file.open-files': 'Open Files...',
        'menu.file.open-folder': 'Open Folder...',
        'menu.file.import-playlist': 'Import Playlist...',
        'menu.file.export-playlist': 'Export Playlist...',
        'menu.playback': 'Playback',
        'menu.playback.play-pause': 'Play / Pause',
        'menu.playback.next': 'Next',
        'menu.playback.previous': 'Previous',
        'menu.playback.volume-up': 'Increase Volume',
        'menu.playback.volume-down': 'Decrease Volume',
        'menu.view': 'View',
        'menu.view.mini-player': 'Toggle Mini Player',
        'menu.view.theme': 'Toggle Dark/Light Theme',
        'menu.view.language': 'Language / 语言',
        'menu.help': 'Help',
        'menu.help.about': 'About Music Player',
        'menu.help.about.title': 'Music Player v1.0.0',
        'menu.help.about.detail': 'A full-featured local music player built with Electron.\nSupports MP3, FLAC, WAV, AAC, OGG, and more.',
      },
    };
    return translations[currentLang]?.[key] || translations['zh-CN'][key] || key;
  }

  const template = [
    {
      label: t('menu.file'),
      submenu: [
        {
          label: t('menu.file.open-files'),
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'open-files');
            }
          },
        },
        {
          label: t('menu.file.open-folder'),
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'open-folder');
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.file.import-playlist'),
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'import-playlist');
            }
          },
        },
        {
          label: t('menu.file.export-playlist'),
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'export-playlist');
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: t('menu.playback'),
      submenu: [
        {
          label: t('menu.playback.play-pause'),
          accelerator: 'Space',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'play-pause');
            }
          },
        },
        {
          label: t('menu.playback.next'),
          accelerator: 'CmdOrCtrl+Right',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'next');
            }
          },
        },
        {
          label: t('menu.playback.previous'),
          accelerator: 'CmdOrCtrl+Left',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'previous');
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.playback.volume-up'),
          accelerator: 'CmdOrCtrl+Up',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'volume-up');
            }
          },
        },
        {
          label: t('menu.playback.volume-down'),
          accelerator: 'CmdOrCtrl+Down',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'volume-down');
            }
          },
        },
      ],
    },
    {
      label: t('menu.view'),
      submenu: [
        {
          label: t('menu.view.mini-player'),
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'toggle-mini');
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.view.theme'),
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('media:shortcut', 'toggle-theme');
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.view.language'),
          submenu: [
            {
              label: '中文',
              type: 'radio',
              checked: currentLang === 'zh-CN',
              click: () => {
                store.set('language', 'zh-CN');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('media:shortcut', 'set-language-zh');
                }
                createMenu(mainWindow, getStore); // Rebuild menu with new language
              },
            },
            {
              label: 'English',
              type: 'radio',
              checked: currentLang === 'en',
              click: () => {
                store.set('language', 'en');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('media:shortcut', 'set-language-en');
                }
                createMenu(mainWindow, getStore); // Rebuild menu with new language
              },
            },
          ],
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: t('menu.help'),
      submenu: [
        {
          label: t('menu.help.about'),
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: t('menu.help.about.title'),
              message: t('menu.help.about.title'),
              detail: t('menu.help.about.detail'),
            });
          },
        },
      ],
    },
  ];

  // macOS adjustments
  if (process.platform === 'darwin') {
    const { app } = require('electron');
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMenu };
