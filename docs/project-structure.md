# Chrome 擴充專案資料夾結構規則（extension/）

本專案採用「可直接載入未封裝」的擴充元件資料夾 `extension/`，讓下載者不需要理解 `docs/`、`scripts/`、`node_modules/` 也能正確安裝。

## 目標

- 讓使用者在 `chrome://extensions/` 一律選擇 `extension/` 即可載入。
- 讓打包產物（zip）只包含擴充元件必需檔案（`manifest.json` 在 zip 根目錄）。
- 將開發工具與擴充元件執行期檔案分離，降低誤操作。

## 目錄分層

```
IDE-Link-Interceptor/
├── extension/           # 擴充元件執行期檔案（Chrome 載入用）
├── scripts/             # 開發/打包/驗證腳本（Node.js）
├── docs/                # 文件
├── dist/                # 打包輸出（zip）
├── package.json         # 開發用 npm scripts
└── node_modules/        # 開發依賴（不應進入 extension/）
```

## extension/ 內容規則

- `extension/` **必須可獨立載入**：包含 `manifest.json`、背景/內容腳本、popup、icons、_locales。
- `extension/` **不得包含**：`node_modules/`、`dist/`、`docs/`、測試檔、打包腳本、任何 token/私密資訊。
- `manifest.json` 的路徑一律以 `extension/` 為根（例如 `content.js`、`icons/icon48.png`）。

## 打包與驗證

- `npm run validate`：驗證 `extension/manifest.json` 與 referenced 檔案是否存在。
- `npm run package`：把 `extension/` 內容打包成 zip（`manifest.json` 會在 zip 根目錄）。
