<div align="center">

<img src="extension/icons/logo.png" width="128" alt="IDEPicker">

#   

**攔截 IDE 協議連結，以你偏好的編輯器開啟**

[![CI](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml/badge.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/pingqLIN/IDE-Link-Interceptor/releases)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)

[English](README.md) · [回報問題](https://github.com/pingqLIN/IDE-Link-Interceptor/issues) · [功能建議](https://github.com/pingqLIN/IDE-Link-Interceptor/issues)

</div>

---

## 🎬 功能展示

<div align="center">

| 彈出視窗介面 | 右鍵選單 |
|:---:|:---:|
| <img src="docs/screenshot-popup.png" width="280" alt="彈出視窗介面"/> | <img src="docs/screenshot-context-menu.png" width="360" alt="右鍵選單"/> |
| *點擊擴充圖示選擇 IDE* | *右鍵快速存取* |

## ✨ 功能亮點

<table>
<tr>
<td width="50%">

### 🔗 協議攔截

自動捕獲 `vscode://`、`cursor://`、`windsurf://` 等 IDE 協議連結

### 🎯 IDE 選擇

從精美的彈出視窗或右鍵選單中選擇你偏好的 IDE

### 🚫 不再有瀏覽器提示

消除煩人的「要開啟 Visual Studio Code 嗎？」對話框

</td>
<td width="50%">

### 📦 擴充套件安裝

在你選擇的 IDE 中開啟 VS Code Marketplace 擴充套件；支援 `.vsix` 直接安裝

### 🔧 MCP 伺服器支援

攔截 MCP 安裝連結並重新導向到你選擇的 IDE

### 💾 設定持久保存

你的 IDE 選擇會被儲存並在瀏覽階段間同步

</td>
</tr>
</table>

---

## 🎯 支援的 IDE

| IDE | 協議 | 狀態 | 支援度 |
|:---|:---|:---:|:---:|
| **VS Code** | `vscode://` | ✅ 穩定版 | 完成測試 |
| **VS Code Insiders** | `vscode-insiders://` | ✅ 預覽版 | 完成測試 |
| **Antigravity** | `antigravity://` | ✅ 已支援 | 完成測試 |
| **Cursor** | `cursor://` | ✅ AI 優先 | 尚未完全測試 |
| **Windsurf** | `windsurf://` | ✅ Codeium | 尚未完全測試 |

---

## 📦 安裝方式

### Chrome / Edge / Brave

1. 下載最新版本或複製此儲存庫
2. 前往 `chrome://extensions/`（Edge 使用者請前往 `edge://extensions/`）
3. 在右上角啟用**開發人員模式**
4. 點擊**載入未封裝項目**
5. 選擇 `extension/` 資料夾（包含 `manifest.json`）

### 從原始碼安裝

```bash
# 複製儲存庫
git clone https://github.com/pingqLIN/IDE-Link-Interceptor.git
cd IDE-Link-Interceptor

# 安裝相依套件
npm install

# 驗證擴充套件
npm run validate
```

---

## 🚀 使用方式

### 方法一：擴充套件彈出視窗

1. 點擊瀏覽器工具列中的擴充套件圖示
2. 從列表中選擇目標 IDE
3. 你的選擇會自動儲存 ✓

### 方法二：右鍵選單

1. 在任何連結或頁面上點擊右鍵
2. 將滑鼠移到 **🔗 選擇目標 IDE**
3. 選擇你偏好的 IDE

> 💡 **提示：** 擴充套件會根據你的瀏覽器語言自動顯示選單文字（英文/繁體中文）

### 方法三：VSIX 安裝

1. 在 `.vsix` 下載連結上點擊右鍵
2. 點擊 **📦 使用 [IDE 名稱] 安裝擴充套件**
3. 擴充套件將在你選擇的 IDE 中安裝

### 方法四：Marketplace 擴充套件

當你在 VS Code Marketplace 或類似網站點擊「安裝」時：

1. 擴充套件攔截 `vscode:extension/...` 連結
2. 將協議轉換為你的目標 IDE（例如 `antigravity:extension/...`）
3. 你的 IDE 開啟並顯示擴充套件頁面
4. 在 IDE 中點擊「安裝」完成安裝

> ⚠️ **注意：** 基於安全考量，所有 VS Code 系列 IDE 都需要在 IDE 內再次點擊安裝。這是平台限制，不是錯誤。

---

## 🔐 權限說明

此擴充套件需要以下權限：

| 權限 | 用途 |
|:---|:---|
| `storage` | 跨瀏覽階段儲存你的 IDE 偏好設定 |
| `contextMenus` | 新增右鍵選單選項 |
| `downloads` | 處理 `.vsix` 檔案安裝 |
| `notifications` | 顯示安裝狀態訊息 |
| `nativeMessaging` | 與原生主機通訊以進行協議註冊 |
| `<all_urls>` | 在任何網頁上攔截 IDE 協議連結 |

> 🔒 **隱私：** 此擴充套件不會收集任何個人資料。所有設定都儲存在你的瀏覽器本機。

---

## 🧪 測試網站

### 快速測試

使用這些網站來測試擴充套件：

| 網站 | 測試動作 |
|:---|:---|
| [GitHub MCP](https://github.com/mcp) | 點擊「Install MCP server」按鈕 |
| [VS Code Marketplace](https://marketplace.visualstudio.com/) | 點擊擴充套件「Install」按鈕 |
| [Open VSX Registry](https://open-vsx.org/) | 下載 `.vsix` 檔案 |

### 擴充功能安裝連結

測試這些直接的擴充功能安裝連結以驗證協議轉換：

- **Python 擴充功能**：`vscode:extension/ms-python.python` - 來自 VS Code Marketplace 的 Python 語言支援
- **Prettier 擴充功能**：`vscode:extension/esbenp.prettier-vscode` - 來自 VS Code Marketplace 的程式碼格式化工具
- **GitHub Copilot**：`vscode-insiders:extension/GitHub.copilot` - 來自 VS Code Marketplace 的 AI 程式設計助手

### 預期的 URL 轉換

| 目標 IDE | 輸入 | 預期輸出 |
|:---|:---|:---|
| Antigravity | `vscode:extension/ms-python.python` | `antigravity://ms-python.python` |
| Cursor | `vscode:extension/ms-python.python` | `cursor:extension/ms-python.python` |
| VS Code | `cursor:extension/ms-python.python` | `vscode:extension/ms-python.python` |
| Antigravity | `vscode://file/path` | `antigravity://file/path` |

### 完整測試頁面

如需進行完整測試，包括 JavaScript 導航和所有連結類型，請造訪[完整測試頁面](test/test-links.html)。您也可以查看[中文版](test/test-links.zh-TW.html)。

---

## 🛠️ 開發指南

### 專案結構

```
IDE-Link-Interceptor/
├── extension/          # 瀏覽器擴充套件原始碼
│   ├── manifest.json   # 擴充套件清單 (MV3)
│   ├── background.js   # Service Worker
│   ├── content.js      # 內容腳本
│   ├── popup.*         # 彈出視窗 UI
│   └── _locales/       # 國際化翻譯
├── native-host/        # 原生訊息主機
├── docs/               # 文件與截圖
└── scripts/            # 建置與工具腳本
```

### 指令

```bash
# 安裝相依套件
npm install

# 執行程式碼檢查
npm run lint

# 自動修正程式碼風格
npm run lint:fix

# 驗證 manifest.json
npm run validate

# 打包擴充套件
npm run package
```

### CI/CD

此專案使用 GitHub Actions：

- **CI 工作流程**（每次推送/PR）：程式碼檢查 → 驗證 → 打包 → 上傳成品
- **Release 工作流程**（推送標籤時）：建立包含打包擴充套件的 GitHub Release

```bash
# 建立新版本發布
git tag v1.6.0
git push origin v1.6.0
```

---

## 🤝 貢獻

歡迎貢獻！請隨時提交 Pull Request。

1. Fork 此儲存庫
2. 建立你的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交你的變更（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 開啟 Pull Request

---

## 📄 授權

以 MIT 授權條款發布。詳見 [LICENSE](LICENSE) 檔案。

---

<div align="center">

**為使用多個 IDE 的開發者用 ❤️ 製作**

[⬆ 回到頂部](#ide-link-interceptor)

</div>
