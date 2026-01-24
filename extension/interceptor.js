/**
 * VS Code IDE Switcher - Interceptor Script (Main World)
 * 
 * 此腳本運行在頁面的 Main World 中，負責攔截：
 * 1. window.location 的變更
 * 2. window.open 調用
 * 
 * 設定值由 content.js (Isolated World) 透過 HTML dataset 傳遞
 */

(function () {
  'use strict';

  const VSCODE_PROTOCOLS = [
    'vscode:',
    'vscode-insiders:',
    'antigraavity:',
    'antigravity:',
    'cursor:',
    'windsurf:',
    'vscodium:'
  ];
  const VSCODE_DEV_PATTERNS = ['vscode.dev/redirect', 'insiders.vscode.dev/redirect'];

  // MCP 安裝 URL 模式
  const MCP_PATTERNS = [
    'vscode:mcp/install',
    'vscode-insiders:mcp/install',
    'cursor://-deeplink/mcp/install'
  ];

  // 避免破壞 OAuth/登入流程（例如 GitHub Copilot / GitHub Auth 回呼）
  function isAuthCallbackUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const match = url.match(/^([^:]+):\/\/([^/]+)\//) || url.match(/^([^:]+):([^/]+)\//);
    const provider = (match?.[2] || '').toLowerCase();
    return provider.includes('authentication');
  }

  // 從 dataset 讀取目標協議，預設為 antigraavity
  function getTargetProtocol() {
    return document.documentElement.dataset.ideTargetProtocol || 'antigraavity';
  }

  // 檢查是否為 VS Code 協議 URL
  function isVSCodeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return VSCODE_PROTOCOLS.some(protocol => url.startsWith(protocol));
  }

  // 檢查是否為 vscode.dev 重定向連結
  function isVSCodeDevUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return VSCODE_DEV_PATTERNS.some(pattern => url.includes(pattern));
  }

  // 檢查是否為 MCP 安裝 URL
  function isMCPUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return MCP_PATTERNS.some(pattern => url.includes(pattern));
  }

  // 轉換 MCP 安裝 URL (支援多種 IDE 格式)
  function convertMCPUrl(url) {
    const targetProtocol = getTargetProtocol();
    
    // vscode:mcp/install?{config} -> targetProtocol:mcp/install?{config}
    // cursor://-deeplink/mcp/install?... -> targetProtocol:mcp/install?{config}
    
    // 處理 Cursor 專屬格式
    if (url.includes('cursor://-deeplink/mcp/install')) {
      try {
        // cursor://-deeplink/mcp/install?name=xxx&config=base64
        const urlPart = url.split('cursor://-deeplink/mcp/install')[1];
        const params = new URLSearchParams(urlPart.startsWith('?') ? urlPart.slice(1) : urlPart);
        const name = params.get('name');
        const configBase64 = params.get('config');
        
        if (configBase64) {
          // 解碼 base64 配置
          const configJson = atob(configBase64);
          // 重新編碼為 URL 編碼的 JSON (VS Code 格式)
          const encodedConfig = encodeURIComponent(configJson);
          
          // 建立新的 MCP URL
          if (name) {
            return `${targetProtocol}:mcp/install?%7B%22name%22%3A%22${encodeURIComponent(name)}%22%2C${encodedConfig.slice(3)}`; 
          }
          return `${targetProtocol}:mcp/install?${encodedConfig}`;
        }
      } catch (e) {
        console.error('[IDE Switcher] MCP URL 轉換失敗:', e);
      }
    }
    
    // 處理 VS Code 格式: vscode:mcp/install?{encoded_json}
    for (const protocol of VSCODE_PROTOCOLS) {
      const mcpPattern = protocol + 'mcp/install';
      if (url.startsWith(mcpPattern)) {
        return url.replace(protocol, targetProtocol + ':');
      }
    }
    
    return url;
  }

  // 轉換 VS Code 協議 URL
  function convertVSCodeUrl(url) {
    const targetProtocol = getTargetProtocol();
    if (url.startsWith(targetProtocol + ':')) return url;
    if (isAuthCallbackUrl(url)) return url;

    for (const protocol of VSCODE_PROTOCOLS) {
      if (url.startsWith(protocol)) {
        return url.replace(protocol, targetProtocol + ':');
      }
    }
    return url;
  }

  // 解碼多層 URL 編碼
  function decodeMultiLayerUrl(encodedUrl) {
    let decoded = encodedUrl;
    let prev = '';
    // 持續解碼直到不再變化（最多 5 層防止無限迴圈）
    for (let i = 0; i < 5 && decoded !== prev; i++) {
      prev = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        break; // 解碼失敗則停止
      }
    }
    return decoded;
  }

  // 轉換 vscode.dev 重定向連結 (支援兩種格式及多層編碼)
  function convertVSCodeDevUrl(url) {
    const targetProtocol = getTargetProtocol();
    try {
      const urlObj = new URL(url);

      // 格式 1: url 參數 (GitHub MCP Registry 使用)
      const urlParam = urlObj.searchParams.get('url');
      if (urlParam) {
        // 使用多層解碼處理雙重或多重編碼的 URL
        const decodedUrl = decodeMultiLayerUrl(urlParam);
        if (isAuthCallbackUrl(decodedUrl)) return decodedUrl;
        
        // 檢查是否為 MCP URL 並進行轉換
        if (isMCPUrl(decodedUrl)) {
          return convertMCPUrl(decodedUrl);
        }
        
        for (const protocol of VSCODE_PROTOCOLS) {
          if (decodedUrl.startsWith(protocol)) {
            return decodedUrl.replace(protocol, targetProtocol + ':');
          }
        }
        if (decodedUrl.startsWith(targetProtocol + ':')) {
          return decodedUrl;
        }
        return decodedUrl;
      }

      // 格式 2: 路徑格式
      const path = urlObj.pathname.replace('/redirect', '');
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      const queryString = urlObj.search;
      return targetProtocol + ':' + normalizedPath + queryString;
    } catch (e) {
      console.error('[IDE Switcher] 轉換失敗:', e);
      return null;
    }
  }

  // 統一處理 URL 轉換
  function processUrl(url) {
    if (isAuthCallbackUrl(url)) return url;
    if (isVSCodeDevUrl(url)) {
      return convertVSCodeDevUrl(url);
    }
    if (isMCPUrl(url)) {
      return convertMCPUrl(url);
    }
    if (isVSCodeUrl(url)) {
      return convertVSCodeUrl(url);
    }
    return url;
  }

  // 檢查是否需要處理
  function needsInterception(url) {
    return isVSCodeUrl(url) || isVSCodeDevUrl(url) || isMCPUrl(url);
  }

  // 攔截 window.location.href 設定
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.location.__proto__, 'href') ||
    Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');

  if (originalDescriptor && originalDescriptor.set) {
    Object.defineProperty(window.location, 'href', {
      get: originalDescriptor.get,
      set: function (value) {
        if (needsInterception(value)) {
          const newUrl = processUrl(value);
          if (newUrl && newUrl !== value) {
            console.log('[IDE Switcher] 攔截 JS 導航: ' + value);
            console.log('[IDE Switcher] 重定向至: ' + newUrl);
            value = newUrl;
          }
        }
        originalDescriptor.set.call(this, value);
      },
      configurable: true
    });
  }

  // 攔截 window.location.assign (透過 Location.prototype)
  const originalAssign = Location.prototype.assign;
  Location.prototype.assign = function (url) {
    if (needsInterception(url)) {
      const newUrl = processUrl(url);
      if (newUrl && newUrl !== url) {
        console.log('[IDE Switcher] 攔截 assign: ' + url);
        console.log('[IDE Switcher] 重定向至: ' + newUrl);
        url = newUrl;
      }
    }
    return originalAssign.call(this, url);
  };

  // 攔截 window.location.replace (透過 Location.prototype)
  const originalReplace = Location.prototype.replace;
  Location.prototype.replace = function (url) {
    if (needsInterception(url)) {
      const newUrl = processUrl(url);
      if (newUrl && newUrl !== url) {
        console.log('[IDE Switcher] 攔截 replace: ' + url);
        console.log('[IDE Switcher] 重定向至: ' + newUrl);
        url = newUrl;
      }
    }
    return originalReplace.call(this, url);
  };

  // 攔截 window.open
  const originalOpen = window.open;
  window.open = function (url, ...args) {
    if (needsInterception(url)) {
      const newUrl = processUrl(url);
      if (newUrl && newUrl !== url) {
        console.log('[IDE Switcher] 攔截 window.open: ' + url);
        console.log('[IDE Switcher] 重定向至: ' + newUrl);
        url = newUrl;
      }
    }
    return originalOpen.call(this, url, ...args);
  };

  console.log('[IDE Switcher] JS 攔截器已就緒');
})();
