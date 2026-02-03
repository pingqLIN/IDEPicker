<p align="center">
  <a href="https://github.com/pingqLIN/IDEPicker">
    <img src="extension/icons/logo.png" width="160" alt="IDEPicker Logo">
  </a>
</p>

<h1 align="center">IDEPicker</h1>

<p align="center">
  <strong>Intercept IDE protocol links and open them in your preferred editor.</strong>
</p>

<p align="center">
  <a href="https://github.com/pingqLIN/IDEPicker/actions/workflows/ci.yml"><img src="https://github.com/pingqLIN/IDEPicker/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/pingqLIN/IDEPicker/releases"><img src="https://img.shields.io/badge/version-1.7.0-blue.svg" alt="Version"></a>
  <a href="https://developer.chrome.com/docs/extensions/mv3/"><img src="https://img.shields.io/badge/Chrome-MV3-green.svg" alt="Chrome MV3"></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#usage">Usage</a> •
  <a href="#supported-ides">Supported IDEs</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="README.zh-TW.md">中文版</a> · 
  <a href="https://github.com/pingqLIN/IDEPicker/issues">Report Bug</a> · 
  <a href="https://github.com/pingqLIN/IDEPicker/issues">Request Feature</a>
</p>

---

## Overview

IDEPicker is a browser extension that intercepts IDE hyperlinks (`vscode://`, `cursor://`, `windsurf://`) from web pages and lets you choose which IDE to open them with.

- **Smart Interception** — Automatically captures and redirects IDE protocol links
- **Flexible Selection** — Switch between multiple IDEs instantly via popup
- **Silent Operation** — Eliminates browser confirmation dialogs
- **MCP Ready** — Full support for Model Context Protocol server installation

---

## Quick Preview

<p align="center">
  <table>
    <tr>
      <th>Popup Interface</th>
      <th>Context Menu</th>
    </tr>
    <tr>
      <td align="center"><img src="docs/screenshot-popup.png" width="280" alt="Popup Interface"></td>
      <td align="center"><img src="docs/screenshot-context-menu.png" width="360" alt="Context Menu"></td>
    </tr>
    <tr>
      <td align="center"><em>One-click Selection</em></td>
      <td align="center"><em>Right-click Access</em></td>
    </tr>
  </table>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| 🔗 **Protocol Interception** | Captures `vscode://`, `cursor://`, `windsurf://` links automatically |
| 🎯 **IDE Switching** | Seamlessly switch between VS Code, Cursor, Windsurf, and more |
| 🚫 **No Popups** | Bypasses annoying "Open Visual Studio Code?" browser dialogs |
| 📦 **Extension Install** | One-click installation for `.vsix` files and Marketplace extensions |
| 🔧 **MCP Support** | Fully supports Model Context Protocol server installation links |

---

## Supported IDEs

| IDE | Protocol | Status | 支援度 |
|-----|----------|:------:|-------|
| VS Code | `vscode://` | ✅ | 完成測試 |
| VS Code Insiders | `vscode-insiders://` | ✅ | 完成測試 |
| Cursor | `cursor://` | ⚠️ | 尚未完全測試 |
| Windsurf | `windsurf://` | ⚠️ | 尚未完全測試 |
| Antigravity | `antigravity://` | ✅ | 完成測試 |

---

## Installation

### Option 1: Load Unpacked (Recommended)

```bash
# 1. Download the latest release
https://github.com/pingqLIN/IDEPicker/releases

# 2. Open browser extensions page
chrome://extensions/   # Chrome
edge://extensions/     # Edge
```

3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked** and select the `extension/` folder

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/pingqLIN/IDEPicker.git
cd IDEPicker

# Install dependencies
npm install

# Validate the build
npm run validate
```

---

## Usage

### Extension Popup

Click the extension icon to select your default IDE. Your choice is saved automatically.

```
Click Extension Icon → Select IDE → Done ✓
```

### Context Menu

Right-click on any link or page → Hover over **🔗 Select Target IDE**

### Installing Extensions

| Source | How to Use |
|--------|------------|
| **Marketplace** | Click "Install" on VS Code Marketplace — IDEPicker intercepts and opens in your target IDE |
| **VSIX Files** | Right-click `.vsix` link → **📦 Install extension with [IDE Name]** |

> **Note:** All VS Code-based IDEs require a second confirmation click inside the IDE for security.

---

## Playground

Test the interception capabilities:

| Type | Action |
|------|--------|
| MCP Server | [Install GitHub MCP](https://github.com/mcp) |
| Extension | [Install Python Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) |
| VSIX Download | [Browse Open VSX](https://open-vsx.org/) |

> **Tip:** When Cursor is selected, `vscode:extension/ms-python.python` automatically converts to `cursor:extension/ms-python.python`

---

## Development

### Project Structure

```
IDEPicker/
├── extension/              # Browser extension source (MV3)
│   ├── background.js       # Service worker
│   ├── content.js          # Content script
│   ├── popup/              # Popup UI
│   └── icons/              # Extension icons
├── native-host/            # Native messaging host
├── scripts/                # Build & utility scripts
└── docs/                   # Documentation & screenshots
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint code analysis |
| `npm run lint:fix` | Auto-fix code style issues |
| `npm run validate` | Validate extension build |
| `npm run package` | Package extension for release |

### Tech Stack

| Component | Technology |
|-----------|------------|
| Extension | Chrome Manifest V3 |
| Language | JavaScript (67.3%) |
| UI | HTML/CSS |
| Build | npm scripts |

---

## Contributing

Contributions are welcome! Here's how you can help:

| Type | Link |
|------|------|
| 🐛 Report Bug | [Open Issue](https://github.com/pingqLIN/IDEPicker/issues) |
| 💡 Request Feature | [Open Issue](https://github.com/pingqLIN/IDEPicker/issues) |
| 📝 Improve Docs | Submit a PR |
| 🔧 Submit Code | Fork → Branch → PR |

### Development Flow

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/IDEPicker.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## License

Distributed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Made with ❤️ for developers who multitask across IDEs.</strong>
</p>

<p align="center">
  <a href="#idepicker">⬆ Back to Top</a>
</p>
