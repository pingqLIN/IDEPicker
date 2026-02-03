<div align="center">

<img src="extension/icons/logo.png" width="128" alt="IDEPicker Logo">

# IDEPicker

**Intercept IDE protocol links and open them in your preferred editor.**
<br>
不再受限於瀏覽器預設，自由選擇開啟 VS Code、Cursor 或 Windsurf。

[![CI](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml/badge.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/releases)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)

[中文版](README.zh-TW.md) · [Report Bug](https://github.com/pingqLIN/IDE-Link-Interceptor/issues) · [Request Feature](https://github.com/pingqLIN/IDE-Link-Interceptor/issues)

</div>

---

## 🎬 Quick Preview

<div align="center">

| Popup Interface | Context Menu |
|:---:|:---:|
| <img src="docs/screenshot-popup.png" width="280" alt="Popup Interface"/> | <img src="docs/screenshot-context-menu.png" width="360" alt="Context Menu"/> |
| **One-click Selection** | **Right-click Access** |

</div>

<br>

## ✨ Why IDEPicker?

- **🔗 Smart Interception**: Automatically captures `vscode://`, `cursor://`, `windsurf://` and redirects them to your chosen tool.
- **🎯 Flexible Selection**: Switch between VS Code, Cursor, or Antigravity instantly via a sleek popup.
- **🚫 Silence the Noise**: Eliminates the annoying *"Open Visual Studio Code?"* browser confirmation dialog.
- **📦 Seamless Installation**: Supports one-click installation for `.vsix` files and Marketplace extensions.
- **🔧 MCP Ready**: Fully supports Model Context Protocol (MCP) server installation links.

---

## 🎯 Supported IDEs

| IDE | Protocol | Status | Notes |
|:---|:---|:---:|:---|
| **VS Code** | `vscode://` | ✅ Stable | Standard Edition |
| **VS Code Insiders** | `vscode-insiders://` | ✅ Preview | For early adopters |
| **Antigravity** | `antigravity://` | ✅ Supported | Full support |
| **Cursor** | `cursor://` | ✅ AI-First | AI Code Editor |
| **Windsurf** | `windsurf://` | ✅ Codeium | Codeium Integration |

---

## 📦 Installation

### Option 1: Load Unpacked (Recommended)

1. Download the [latest release](https://github.com/pingqLIN/IDE-Link-Interceptor/releases) or clone this repo.
2. Go to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** (Top right corner).
4. Click **Load unpacked** and select the `extension/` folder.

### Option 2: Build from Source

```bash
# Clone the repository
git clone [https://github.com/pingqLIN/IDE-Link-Interceptor.git](https://github.com/pingqLIN/IDE-Link-Interceptor.git)
cd IDE-Link-Interceptor

# Install dependencies & Validate
npm install
npm run validate
```

---

## 🚀 Usage Guide

### 1. Extension Popup
Click the extension icon <img src="extension/icons/logo.png" width="16" style="vertical-align:middle"> to select your default IDE. Your choice is saved automatically.

### 2. Context Menu
Right-click on any link or page > Hover over **🔗 Select Target IDE**.

### 3. Installing Extensions (VSIX / Marketplace)
* **Marketplace**: Click "Install" on the VS Code Marketplace. IDEPicker will intercept and open it in your target IDE (e.g., Cursor).
* **Direct Download**: Right-click a `.vsix` link > **📦 Install extension with [IDE Name]**.

> [!NOTE]
> **A Note on Security**: All VS Code-based IDEs require a second click *inside* the IDE to confirm installation. This is a platform security feature, not a bug.

---

## 🧪 Playground (Try it out)

Test the interception capabilities with these live links:

| Type | Test Action |
|:---|:---|
| **MCP Server** | [Install GitHub MCP](https://github.com/mcp) |
| **Extension** | [Install Python (Marketplace)](https://marketplace.visualstudio.com/items?itemName=ms-python.python) |
| **Download** | [Download Open VSX (.vsix)](https://open-vsx.org/) |

> [!TIP]
> **Protocol Conversion Example**:
> If you select **Cursor** as your IDE, clicking a `vscode:extension/ms-python.python` link will automatically convert to `cursor:extension/ms-python.python`.

---

## 🛠️ Development

### Project Structure
```text
IDE-Link-Interceptor/
├── extension/          # Browser extension source (MV3)
│   ├── background.js   # Service worker
│   ├── content.js      # Content script
│   └── popup/          # UI Logic
├── native-host/        # Native messaging host
└── scripts/            # Build & utility scripts
```

### Commands
```bash
npm run lint      # Run ESLint
npm run lint:fix  # Auto-fix code style
npm run package   # Package extension for release
```

---

## 🤝 Contributing & License

Contributions are welcome! Please open an issue or submit a PR.
Distributed under the **MIT License**.

<div align="center">
<br>

**Made with ❤️ for developers who multitask across IDEs.**

[⬆ Back to top](#idepicker)
</div>
