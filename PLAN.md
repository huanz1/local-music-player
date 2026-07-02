# Plan: Add Chinese/English Language Switching to Menu

## Overview
Add i18n (internationalization) support with Chinese (zh-CN) and English (en) language switching via the menu bar. The language preference is persisted in electron-store.

## Files to Create/Modify

### 1. NEW: `renderer/js/i18n.js` — Translation Dictionary & Manager
- Define a `I18nManager` class with:
  - `translations` object containing all UI strings in `zh-CN` and `en`
  - `currentLang` (default `'zh-CN'`)
  - `t(key)` method to look up translations
  - `setLanguage(lang)` method
  - `_loadSaved()` to load from store
  - `_save()` to persist to store
  - `_applyToDOM()` to update all text nodes in the DOM
  - `onLanguageChange` callback for dynamic updates
- Translation keys cover: menu labels, button titles, placeholders, empty states, dialog labels, etc.

### 2. MODIFY: `main/menu.js` — Add Language submenu
- Add a "Language / 语言" submenu under View (or as a top-level menu)
- Two radio-type items: "中文" and "English"
- On click, send `'media:shortcut'` IPC with action `'set-language-zh'` / `'set-language-en'`
- Menu labels themselves should also reflect the current language (but since menu is built once, we can rebuild it on language change, or use simple English labels for the menu itself)

### 3. MODIFY: `main/index.js` — Support menu rebuild on language change
- Store the `createMenu` function reference for re-calling
- Listen for language change to rebuild menu

### 4. MODIFY: `renderer/index.html` — Add i18n.js script tag
- Add `<script src="js/i18n.js"></script>` before `app.js`

### 5. MODIFY: `renderer/js/app.js` — Initialize i18n
- Initialize `i18nManager` and wire up language change handling

### 6. MODIFY: `renderer/js/keyboard.js` — Handle language switch action
- Add `'set-language-zh'` and `'set-language-en'` cases in `_handleMediaAction`

### 7. MODIFY: `renderer/index.html` — Add data-i18n attributes
- Add `data-i18n` attributes to key UI elements for dynamic text replacement

### 8. MODIFY: `main/preload.js` — No changes needed (already exposes storeGet/storeSet)

## Translation Strategy
- All UI strings are centralized in `i18n.js`
- The `_applyToDOM()` method walks elements with `[data-i18n]` attributes and replaces their text
- Dynamic content (track names, etc.) is not translated
- Menu labels are updated by rebuilding the menu

## Key Design Decisions
- Store language preference in electron-store under key `'language'`
- Default to `'zh-CN'` since the HTML already uses Chinese
- Menu rebuilds on language change to reflect translated labels
- Use `data-i18n` attributes for static text, programmatic `i18nManager.t()` for JS-generated text