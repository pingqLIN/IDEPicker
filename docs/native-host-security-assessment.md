# Native Host 安全評估報告
# Security Assessment for Native Host Protocol Registration

本文件評估使用 Native Messaging Host 處理 IDE 協議（URL Scheme）註冊的安全風險，並提出改進建議。

---

## 目錄

1. [現行架構概述](#1-現行架構概述)
2. [使用 Native Host 處理註冊的風險評估](#2-使用-native-host-處理註冊的風險評估)
3. [無需修改系統註冊的替代方案](#3-無需修改系統註冊的替代方案)
4. [現行執行方式的安全強化建議](#4-現行執行方式的安全強化建議)
5. [總結與建議](#5-總結與建議)

---

## 1. 現行架構概述

### 1.1 系統組件

```
┌─────────────────┐     Native Messaging     ┌──────────────────┐
│ Browser         │ ◄──────────────────────► │ Native Host      │
│ Extension       │     (JSON over stdin/    │ (Node.js)        │
│ (background.js) │      stdout)             │ ide-link-host.js │
└─────────────────┘                          └────────┬─────────┘
                                                      │
                                             ┌────────▼─────────┐
                                             │ protocol-helper  │
                                             │ (Registry 操作)  │
                                             └────────┬─────────┘
                                                      │
                                             ┌────────▼─────────┐
                                             │ Windows Registry │
                                             │ HKCU\Software\   │
                                             │ Classes\{proto}  │
                                             └──────────────────┘
```

### 1.2 目前支援的操作

| Action | 說明 | 風險等級 |
|--------|------|----------|
| `ping` | 檢查 Native Host 狀態 | 🟢 低 |
| `install` | 呼叫 IDE CLI 安裝擴充功能 | 🟡 中 |
| `checkProtocol` | 讀取 Registry 檢查協議註冊 | 🟢 低 |
| `registerProtocol` | 寫入 Registry 註冊協議 | 🔴 高 |
| `findIDEPath` | 檢查檔案系統尋找 IDE | 🟢 低 |

---

## 2. 使用 Native Host 處理註冊的風險評估

### 2.1 安全風險

#### 🔴 高風險：Registry 寫入操作

**風險描述**：`registerProtocol` 功能會修改 Windows Registry（HKCU\Software\Classes），這是一個敏感的系統操作。

**潛在威脅**：

1. **惡意協議劫持**
   - 攻擊者若能控制 Native Host 輸入，可能註冊惡意的協議處理程式
   - 例如：將 `vscode://` 指向惡意執行檔

2. **路徑注入攻擊**
   - `execPath` 參數若未經驗證，可能被注入惡意路徑
   - PowerShell 指令拼接時存在命令注入風險

3. **權限提升**
   - 雖然使用 HKCU（不需管理員權限），但 Registry 修改仍屬敏感操作
   - 惡意軟體可能利用此通道進行持久化

**現行程式碼風險點**：

```javascript
// protocol-helper.js - Line 98
const escapedValue = value.replace(/"/g, '\\"');

// 此處僅對雙引號轉義，但未處理其他特殊字元
// 例如 $(), ``, ; 等可能導致 PowerShell 命令注入
```

#### 🟡 中風險：命令執行

**風險描述**：`installExtension` 功能會執行外部命令（IDE CLI）。

**現行程式碼風險點**：

```javascript
// ide-link-host.js - Line 57
const child = spawn(command, args, {
  shell: true,  // 使用 shell: true 增加了命令注入風險
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe']
});
```

**潛在威脅**：
- 若 `extensionId` 參數包含特殊字元，可能導致命令注入
- 例如：`test; malicious-command` 可能被執行

#### 🟢 低風險：資訊洩露

**風險描述**：`checkProtocol` 和 `findIDEPath` 可能洩露系統資訊。

**潛在威脅**：
- 攻擊者可透過擴充功能探測系統安裝的軟體
- 可用於偵察攻擊前的資訊收集

### 2.2 攻擊向量分析

| 攻擊向量 | 可能性 | 影響 | 緩解措施 |
|----------|--------|------|----------|
| 惡意網站觸發 | 低 | 高 | 僅擴充功能可呼叫 Native Host |
| 惡意擴充功能 | 中 | 高 | `allowed_origins` 限制 |
| 中間人攻擊 | 低 | 高 | Native Messaging 為本地通訊 |
| 輸入驗證繞過 | 中 | 高 | 需加強輸入驗證 |

---

## 3. 無需修改系統註冊的替代方案

### 3.1 方案一：純協議重導向（目前已實作）

**說明**：不修改系統 Registry，僅在瀏覽器層級攔截連結並重導向。

```javascript
// content.js - 將 vscode:// 轉換為目標 IDE 協議
const newUrl = originalUrl.replace(/^vscode(-insiders)?:/, targetProtocol);
window.location.href = newUrl;
```

**優點**：
- ✅ 不需要 Native Host
- ✅ 不修改系統設定
- ✅ 安裝即可使用

**缺點**：
- ❌ 需要目標 IDE 已自行註冊協議
- ❌ 無法處理 IDE 未註冊協議的情況

**適用情境**：
- IDE 已正確安裝並註冊協議
- 用戶只需要「切換」目標 IDE

### 3.2 方案二：引導式手動註冊

**說明**：提供使用者 `.reg` 檔案或指示，讓使用者自行決定是否修改系統。

```javascript
// 在 Popup 中提供下載 .reg 檔案的功能
function generateRegFile(protocol, execPath) {
  const content = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\${protocol}]
@="URL:${protocol} Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command]
@="\\"${execPath.replace(/\\/g, '\\\\')}\\\" \\"%1\\""
`;
  return content;
}
```

**優點**：
- ✅ 使用者完全控制註冊過程
- ✅ 透明度高，使用者知道在做什麼
- ✅ 不需要 Native Host 權限

**缺點**：
- ❌ 使用者體驗較差，需要手動操作
- ❌ 非技術用戶可能不熟悉 Registry

**適用情境**：
- 企業環境要求使用者手動確認系統變更
- 安全敏感的使用者

### 3.3 方案三：IDE 內建協議偵測

**說明**：在點擊連結前，先檢查目標協議是否可用。

```javascript
// 嘗試開啟協議並偵測是否成功
async function checkProtocolAvailable(protocol) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${protocol}://ping`;
    
    const timeout = setTimeout(() => {
      resolve(false);
      iframe.remove();
    }, 1000);
    
    // 若協議存在，頁面不會報錯
    iframe.onload = () => {
      clearTimeout(timeout);
      resolve(true);
      iframe.remove();
    };
    
    document.body.appendChild(iframe);
  });
}
```

**優點**：
- ✅ 不需要修改系統
- ✅ 可在無 Native Host 時提供降級體驗

**缺點**：
- ❌ 偵測不可靠（瀏覽器行為不一致）
- ❌ 可能觸發系統對話框

### 3.4 方案四：VSIX 下載 + CLI 安裝

**說明**：直接下載 .vsix 檔案，然後透過 Native Host 呼叫 IDE CLI 安裝。

```javascript
// 不使用協議，改用 CLI 安裝
async function installViaDownload(vsixUrl, ide) {
  // 1. 下載 VSIX 到臨時目錄
  const vsixPath = await downloadVsix(vsixUrl);
  
  // 2. 透過 Native Host 呼叫 IDE CLI
  await nativeHost.send({
    action: 'install-vsix',
    ide: ide,
    vsixPath: vsixPath
  });
}
```

**優點**：
- ✅ 不需要協議註冊
- ✅ 安裝過程完全可控

**缺點**：
- ❌ 仍需要 Native Host
- ❌ 需要額外的下載步驟
- ❌ 需要處理暫存檔案清理

### 3.5 方案比較總結

| 方案 | 安全性 | 使用者體驗 | 實作複雜度 | 建議 |
|------|--------|------------|------------|------|
| 純協議重導向 | 🟢 高 | 🟢 好 | 🟢 低 | ✅ **推薦作為主要方案** |
| 引導式手動註冊 | 🟢 高 | 🟡 中 | 🟢 低 | ✅ 作為進階選項 |
| IDE 內建協議偵測 | 🟢 高 | 🟡 中 | 🟡 中 | ⚠️ 可選實作 |
| VSIX 下載 + CLI | 🟡 中 | 🟡 中 | 🔴 高 | ⚠️ 特定情境使用 |
| 自動 Registry 註冊 | 🔴 低 | 🟢 好 | 🟡 中 | ❌ 不建議作為預設 |

---

## 4. 現行執行方式的安全強化建議

### 4.1 輸入驗證強化

#### 4.1.1 協議名稱白名單

```javascript
// protocol-helper.js - 新增
const ALLOWED_PROTOCOLS = new Set([
  'vscode',
  'vscode-insiders',
  'antigravity',
  'cursor',
  'windsurf'
]);

function validateProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') {
    throw new Error('Invalid protocol: must be a non-empty string');
  }
  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    throw new Error(`Invalid protocol: ${protocol} is not in allowlist`);
  }
  return protocol;
}
```

#### 4.1.2 路徑驗證

```javascript
// protocol-helper.js - 新增
const path = require('path');

function validateExecPath(execPath) {
  if (!execPath || typeof execPath !== 'string') {
    throw new Error('Invalid execPath: must be a non-empty string');
  }
  
  // 正規化路徑
  const normalized = path.normalize(execPath);
  
  // 禁止路徑穿越
  if (normalized.includes('..')) {
    throw new Error('Invalid execPath: path traversal detected');
  }
  
  // 確保是 .exe 檔案 (Windows)
  if (!normalized.toLowerCase().endsWith('.exe')) {
    throw new Error('Invalid execPath: must be an .exe file');
  }
  
  // 確保路徑是絕對路徑
  if (!path.isAbsolute(normalized)) {
    throw new Error('Invalid execPath: must be an absolute path');
  }
  
  return normalized;
}
```

#### 4.1.3 Extension ID 驗證

```javascript
// ide-link-host.js - 新增
function validateExtensionId(extensionId) {
  if (!extensionId || typeof extensionId !== 'string') {
    throw new Error('Invalid extensionId: must be a non-empty string');
  }
  
  // VS Code 擴充功能 ID 格式: publisher.name
  // 只允許字母、數字、連字號、底線、點
  const validPattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(extensionId)) {
    throw new Error('Invalid extensionId: format must be "publisher.name"');
  }
  
  // 長度限制
  if (extensionId.length > 128) {
    throw new Error('Invalid extensionId: too long');
  }
  
  return extensionId;
}
```

### 4.2 避免 Shell 注入

#### 4.2.1 移除 shell: true

```javascript
// ide-link-host.js - 修改建議
function installExtension(ide, extensionId) {
  return new Promise((resolve, reject) => {
    const command = IDE_COMMANDS[ide];
    
    if (!command) {
      reject(new Error(`Unknown IDE: ${ide}`));
      return;
    }
    
    // 驗證 extensionId
    try {
      validateExtensionId(extensionId);
    } catch (err) {
      reject(err);
      return;
    }
    
    const args = ['--install-extension', extensionId];
    
    // 修改：移除 shell: true，直接執行命令
    const child = spawn(command, args, {
      // shell: true,  // ⚠️ 移除此行
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // ... 其餘程式碼不變
  });
}
```

#### 4.2.2 PowerShell 參數安全處理

```javascript
// protocol-helper.js - 修改建議
function writeRegistry(keyPath, value) {
  return new Promise((resolve) => {
    // 使用 Base64 編碼避免特殊字元問題
    const encodedValue = Buffer.from(value, 'utf16le').toString('base64');
    const encodedPath = Buffer.from(keyPath, 'utf16le').toString('base64');
    
    const script = `
      $ErrorActionPreference = 'Stop'
      try {
        $path = [System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encodedPath}'))
        $value = [System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encodedValue}'))
        
        $parent = Split-Path -Parent $path
        if (-not (Test-Path $parent)) {
          New-Item -Path $parent -Force | Out-Null
        }
        if (-not (Test-Path $path)) {
          New-Item -Path $path -Force | Out-Null
        }
        Set-ItemProperty -Path $path -Name '(default)' -Value $value
        Write-Output 'SUCCESS'
      } catch {
        Write-Output "ERROR: $_"
      }
    `;
    
    // ... 其餘程式碼
  });
}
```

### 4.3 權限最小化

#### 4.3.1 移除不必要的 Registry 寫入功能

```javascript
// ide-link-host.js - 建議將 registerProtocol 設為可選功能
// 預設停用，需要使用者明確啟用

async function handleMessage(message) {
  // ... 其他處理
  
  // 註冊協議 - 預設停用
  if (action === 'registerProtocol') {
    // 檢查是否啟用此功能
    if (!process.env.ENABLE_PROTOCOL_REGISTRATION) {
      return { 
        success: false, 
        error: 'Protocol registration is disabled. Set ENABLE_PROTOCOL_REGISTRATION=true to enable.' 
      };
    }
    
    // ... 原有邏輯
  }
}
```

### 4.4 日誌與稽核

#### 4.4.1 新增操作日誌

```javascript
// ide-link-host.js - 新增
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.env.APPDATA || '.', 'IDEPicker', 'native-host.log');

function log(level, action, details) {
  const timestamp = new Date().toISOString();
  const entry = JSON.stringify({
    timestamp,
    level,
    action,
    ...details
  });
  
  try {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (err) {
    // 日誌失敗不應影響主要功能
    console.error('Failed to write log:', err.message);
  }
}

// 使用範例
async function handleMessage(message) {
  log('INFO', 'receive_message', { action: message.action });
  
  try {
    const result = await processMessage(message);
    log('INFO', 'message_processed', { 
      action: message.action, 
      success: result.success 
    });
    return result;
  } catch (err) {
    log('ERROR', 'message_error', { 
      action: message.action, 
      error: err.message 
    });
    throw err;
  }
}
```

### 4.5 使用者確認機制

#### 4.5.1 敏感操作確認

對於 Registry 修改等敏感操作，建議在 Popup UI 中加入確認步驟：

```javascript
// popup.js - 新增確認對話框
async function requestProtocolRegistration(protocol) {
  const confirmed = confirm(
    `This will register the "${protocol}://" protocol in Windows Registry.\n\n` +
    `This allows your browser to open links in ${protocol}.\n\n` +
    `Do you want to proceed?`
  );
  
  if (!confirmed) {
    return { success: false, cancelled: true };
  }
  
  return chrome.runtime.sendMessage({
    action: 'registerProtocol',
    protocol
  });
}
```

---

## 5. 總結與建議

### 5.1 風險等級總結

| 功能 | 現行風險 | 建議措施後風險 |
|------|----------|----------------|
| 協議註冊 (registerProtocol) | 🔴 高 | 🟡 中（實施建議後） |
| 擴充功能安裝 (install) | 🟡 中 | 🟢 低（實施建議後） |
| 協議檢查 (checkProtocol) | 🟢 低 | 🟢 低 |
| 路徑查找 (findIDEPath) | 🟢 低 | 🟢 低 |

### 5.2 實作優先順序建議

#### 高優先（建議立即實施）
1. ✅ 加入輸入驗證（協議白名單、路徑驗證、Extension ID 驗證）
2. ✅ 移除 `spawn` 的 `shell: true` 選項
3. ✅ 改善 PowerShell 參數處理

#### 中優先（建議短期實施）
4. 📋 新增操作日誌
5. 📋 實作引導式手動註冊功能
6. 📋 敏感操作的使用者確認

#### 低優先（長期規劃）
7. 📋 Registry 註冊功能預設停用
8. 📋 考慮簽章 Native Host 執行檔

### 5.3 推薦架構

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Extension                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 主要功能（無 Native Host 也可運作）                       │   │
│  │  • 協議連結攔截與轉換                                     │   │
│  │  • IDE 選擇儲存                                          │   │
│  │  • 右鍵選單                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 進階功能（需要 Native Host）                              │   │
│  │  • 擴充功能 CLI 安裝（較安全）                            │   │
│  │  • 協議註冊狀態檢查（唯讀，安全）                         │   │
│  │  • IDE 路徑偵測（唯讀，安全）                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 高權限功能（需使用者明確同意）                            │   │
│  │  • 自動協議註冊（可選功能，預設停用）                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 結論

1. **不建議將自動協議註冊作為預設功能**：Registry 修改是高風險操作，應讓使用者自行選擇。

2. **主要功能應能在無 Native Host 時運作**：協議轉換是核心功能，不應依賴 Native Host。

3. **Native Host 應專注於「輔助」功能**：如擴充功能安裝、狀態檢查等。

4. **實施輸入驗證是必要的**：目前的實作存在注入風險，應立即修復。

5. **提供透明度**：任何系統修改都應讓使用者知情並同意。

---

## 附錄：相關檔案

- `native-host/ide-link-host.js` - Native Host 主程式
- `native-host/protocol-helper.js` - 協議註冊輔助模組
- `native-host/install.ps1` - Native Host 安裝腳本
- `extension/background.js` - 擴充功能背景腳本

---

*文件版本：1.0*  
*最後更新：2026-02*
