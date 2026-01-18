# VS Code IDE Switcher

Chrome 擴充功能，攔截 VS Code 連結（`vscode://`），讓你選擇要用哪個 IDE 開啟。

## 支援的 IDE

| IDE              | 協議                 |
| ---------------- | -------------------- |
| VS Code          | `vscode://`          |
| VS Code Insiders | `vscode-insiders://` |
| Antigravity      | `antigravity://`     |
| Cursor           | `cursor://`          |
| Windsurf         | `windsurf://`        |

## 安裝

1. Chrome 網址列輸入 `chrome://extensions/`
2. 開啟右上角「**開發人員模式**」
3. 點擊「**載入未封裝項目**」
4. 選擇此資料夾

## 使用方式

1. 點擊工具列的擴充功能圖示
2. 從 Popup 選擇目標 IDE
3. 之後點擊任何 VS Code 連結都會導向選擇的 IDE

## 檔案結構

```
vscode-antigravity-linker/
├── manifest.json    # 擴充功能配置
├── content.js       # 連結攔截腳本
├── popup.html       # Popup 介面
├── popup.css        # Popup 樣式
├── popup.js         # Popup 邏輯
├── icons/           # 擴充功能圖示
└── docs/            # 開發文件
```

## 測試

- [GitHub MCP](https://github.com/mcp)
- [VS Code Marketplace](https://marketplace.visualstudio.com/)

## License

MIT
