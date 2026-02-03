<div align="center">

<img src="extension/icons/logo.png" width="128" alt="IDEPicker">

# IDEPicker

**Intercept IDE protocol links and open them in your preferred editor**

[![CI](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml/badge.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/releases)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)

[中文版](README.zh-TW.md) · [Report Bug](https://github.com/pingqLIN/IDE-Link-Interceptor/issues) · [Request Feature](https://github.com/pingqLIN/IDE-Link-Interceptor/issues)

</div>

---

## 🎬 Demo

<div align="center">

| Popup Interface | Context Menu |
|:---:|:---:|
| <img src="docs/screenshot-popup.png" width="280" alt="Popup Interface"/> | <img src="docs/screenshot-context-menu.png" width="360" alt="Context Menu"/> |
| *Click extension icon to select IDE* | *Right-click for quick access* |

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🔗 Protocol Interception

Captures `vscode://`, `cursor://`, `windsurf://` and other IDE protocol links automatically

### 🎯 IDE Selection

Choose your preferred IDE from a sleek popup or context menu

### 🚫 No Browser Prompts

Eliminates the annoying "Open Visual Studio Code?" dialog

</td>
<td width="50%">

### 📦 Extension Installation

Opens VS Code Marketplace extensions in your chosen IDE; supports `.vsix` direct installation

### 🔧 MCP Server Support

Intercepts MCP install links and redirects to your IDE of choice

### 💾 Persistent Settings

Your IDE selection is saved and synced across browsing sessions

</td>
</tr>
</table>

---

## 🎯 Supported IDEs

| IDE | Protocol | Status |
|:---|:---|:---:|
| **VS Code** | `vscode://` | ✅ Stable |
| **VS Code Insiders** | `vscode-insiders://` | ✅ Preview |
| **Antigravity** | `antigravity://` | ✅ Supported |
| **Cursor** | `cursor://` | ✅ AI-First |
| **Windsurf** | `windsurf://` | ✅ Codeium |

---

## 📦 Installation

### Chrome / Edge / Brave

1. Download the latest release or clone this repository
2. Navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked**
5. Select the `extension/` folder (contains `manifest.json`)

### From Source

```bash
# Clone the repository
git clone https://github.com/pingqLIN/IDE-Link-Interceptor.git
cd IDE-Link-Interceptor

# Install dependencies
npm install

# Validate the extension
npm run validate
```

---

## 🚀 Usage

### Method 1: Extension Popup

1. Click the extension icon in the browser toolbar
2. Select your target IDE from the list
3. Your choice is automatically saved ✓

### Method 2: Context Menu

1. Right-click on any link or page
2. Hover over **🔗 Select Target IDE**
3. Select your preferred IDE

> 💡 **Tip:** The extension automatically displays menu text in your browser's language (English/Traditional Chinese)

### Method 3: VSIX Installation

1. Right-click on a `.vsix` download link
2. Click **📦 Install extension with [IDE Name]**
3. The extension will be installed in your chosen IDE

### Method 4: Marketplace Extensions

When you click "Install" on VS Code Marketplace or similar sites:

1. The extension intercepts the `vscode:extension/...` link
2. Converts the protocol to your target IDE (e.g., `antigravity:extension/...`)
3. Your IDE opens and displays the extension page
4. Click "Install" inside the IDE to complete

> ⚠️ **Note:** All VS Code-based IDEs require a second click inside the IDE for security reasons. This is a platform limitation, not a bug.

---

## 🔐 Permissions

This extension requires the following permissions:

| Permission | Purpose |
|:---|:---|
| `storage` | Save your IDE preference across sessions |
| `contextMenus` | Add right-click menu options |
| `downloads` | Handle `.vsix` file installations |
| `notifications` | Show installation status messages |
| `nativeMessaging` | Communicate with native host for protocol registration |
| `<all_urls>` | Intercept IDE protocol links on any webpage |

> 🔒 **Privacy:** This extension does not collect any personal data. All settings are stored locally in your browser.

---

## 🧪 Testing

### Quick Tests

Try these websites to test the extension:

| Website | Test Action |
|:---|:---|
| [GitHub MCP](https://github.com/mcp) | Click "Install MCP server" buttons |
| [VS Code Marketplace](https://marketplace.visualstudio.com/) | Click extension "Install" buttons |
| [Open VSX Registry](https://open-vsx.org/) | Download `.vsix` files |

### Extension Install Links

Test these direct extension installation links to verify protocol conversion:

- **Python Extension**: `vscode:extension/ms-python.python` - Python language support from VS Code Marketplace
- **Prettier Extension**: `vscode:extension/esbenp.prettier-vscode` - Code formatter from VS Code Marketplace  
- **GitHub Copilot**: `vscode-insiders:extension/GitHub.copilot` - AI programming assistant from VS Code Marketplace

### Expected URL Conversions

| Target IDE | Input | Expected Output |
|:---|:---|:---|
| Antigravity | `vscode:extension/ms-python.python` | `antigravity://extension/ms-python.python` |
| Cursor | `vscode:extension/ms-python.python` | `cursor:extension/ms-python.python` |
| VS Code | `cursor:extension/ms-python.python` | `vscode:extension/ms-python.python` |
| Antigravity | `vscode://file/path` | `antigravity://file/path` |

### Complete Test Page

For comprehensive testing including JavaScript navigation and all link types, visit the [complete test page](test/test-links.html). You can also view the [Chinese version](test/test-links.zh-TW.html).

---

## 🛠️ Development

### Project Structure

```
IDE-Link-Interceptor/
├── extension/          # Browser extension source
│   ├── manifest.json   # Extension manifest (MV3)
│   ├── background.js   # Service worker
│   ├── content.js      # Content script
│   ├── popup.*         # Popup UI
│   └── _locales/       # i18n translations
├── native-host/        # Native messaging host
├── docs/               # Documentation & screenshots
└── scripts/            # Build & utility scripts
```

### Commands

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Auto-fix code style
npm run lint:fix

# Validate manifest.json
npm run validate

# Package the extension
npm run package
```

### CI/CD

This project uses GitHub Actions:

- **CI Workflow** (on every push/PR): Linting → Validation → Packaging → Artifact upload
- **Release Workflow** (on tag push): Creates GitHub Release with packaged extension

```bash
# Create a new release
git tag v1.6.0
git push origin v1.6.0
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">

**Made with ❤️ for developers who use multiple IDEs**

[⬆ Back to top](#ide-link-interceptor)

</div>
