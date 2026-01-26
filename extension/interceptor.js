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
    'cursor://anysphere.cursor-deeplink/mcp/install',  // Cursor 官方 deeplink 格式
    'cursor://-deeplink/mcp/install',  // 舊格式相容
    'vscode:mcp/by-name',
    'vscode-insiders:mcp/by-name'
  ];

  // 避免破壞 OAuth/登入流程（例如 GitHub Copilot / GitHub Auth 回呼）
  function isAuthCallbackUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const match = url.match(/^([^:]+):\/\/([^/]+)\//) || url.match(/^([^:]+):([^/]+)\//);
    const provider = (match?.[2] || '').toLowerCase();
    return provider.includes('authentication');
  }

  // 從 dataset 讀取目標協議，預設為 antigravity
  function getTargetProtocol() {
    return document.documentElement.dataset.ideTargetProtocol || 'antigravity';
  }

  function getMcpProtocolPrefix() {
    const targetProtocol = getTargetProtocol();
    return targetProtocol === 'antigravity' ? `${targetProtocol}://` : `${targetProtocol}:`;
  }

  /**
   * 取得協議前綴
   * Antigravity 使用 antigravity:// 格式（有雙斜線）
   * 其他 IDE 使用 protocol: 格式（無雙斜線）
   */
  function getProtocolPrefix() {
    const targetProtocol = getTargetProtocol();
    return targetProtocol === 'antigravity' ? `${targetProtocol}://` : `${targetProtocol}:`;
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

    // 如果目標是 Cursor，需要轉換成 Cursor deeplink 格式
    // cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_CONFIG
    if (targetProtocol === 'cursor') {
      return convertToCursorMCPUrl(url);
    }

    // 處理 Cursor 專屬格式轉換為其他 IDE
    if (url.includes('cursor://anysphere.cursor-deeplink/mcp/install') || 
        url.includes('cursor://-deeplink/mcp/install')) {
      try {
        const urlPart = url.includes('anysphere.cursor-deeplink') 
          ? url.split('cursor://anysphere.cursor-deeplink/mcp/install')[1]
          : url.split('cursor://-deeplink/mcp/install')[1];
        const params = new URLSearchParams(urlPart.startsWith('?') ? urlPart.slice(1) : urlPart);
        const name = params.get('name');
        const configBase64 = params.get('config');

        if (configBase64) {
          // 解碼 base64 配置
          const configJson = atob(configBase64);
          const config = JSON.parse(configJson);
          
          // 建立標準 MCP 配置
          const mcpConfig = name ? { name, ...config } : config;
          const encodedConfig = encodeURIComponent(JSON.stringify(mcpConfig));
          
          return `${getMcpProtocolPrefix()}mcp/install?${encodedConfig}`;
        }
      } catch (e) {
        console.error('[IDE Switcher] Cursor MCP URL 轉換失敗:', e);
      }
    }

    // 處理 VS Code 格式: vscode:mcp/install?{encoded_json} 或 vscode:mcp/by-name/...
    for (const protocol of VSCODE_PROTOCOLS) {
      if (url.startsWith(protocol + 'mcp/install') || url.startsWith(protocol + 'mcp/by-name')) {
        return url.replace(protocol, getMcpProtocolPrefix());
      }
    }

    return url;
  }

  // 轉換為 Cursor MCP deeplink 格式
  function convertToCursorMCPUrl(url) {
    try {
      // 從 VS Code 格式解析 MCP 配置
      // vscode:mcp/install?{url_encoded_json}
      let mcpConfig = null;
      let configJson = null;

      // 嘗試解析 URL 編碼的 JSON 配置
      for (const protocol of VSCODE_PROTOCOLS) {
        if (url.startsWith(protocol + 'mcp/install?')) {
          const queryPart = url.split('?')[1];
          if (queryPart) {
            configJson = decodeURIComponent(queryPart);
            mcpConfig = JSON.parse(configJson);
            break;
          }
        }
      }

      if (mcpConfig) {
        const name = mcpConfig.name || 'mcp-server';
        // 移除 name 屬性後編碼為 base64
        // eslint-disable-next-line no-unused-vars
        const { name: _removed, ...configWithoutName } = mcpConfig;
        const configBase64 = btoa(JSON.stringify(configWithoutName));
        
        return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${configBase64}`;
      }
    } catch (e) {
      console.error('[IDE Switcher] 轉換至 Cursor MCP 格式失敗:', e);
    }

    // 回退：直接替換協議前綴
    for (const protocol of VSCODE_PROTOCOLS) {
      if (url.startsWith(protocol + 'mcp/')) {
        return url.replace(protocol, 'cursor:');
      }
    }

    return url;
  }

  // 轉換 VS Code 協議 URL
  function convertVSCodeUrl(url) {
    const targetProtocol = getTargetProtocol();
    // 已經是目標協議
    if (url.startsWith(targetProtocol + ':') || url.startsWith(targetProtocol + '://')) return url;
    if (isAuthCallbackUrl(url)) return url;

    for (const protocol of VSCODE_PROTOCOLS) {
      if (url.startsWith(protocol)) {
        // 移除來源協議，取得路徑部分
        const path = url.slice(protocol.length);
        // 根據目標協議格式重建 URL
        return getProtocolPrefix() + path;
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
            // 移除來源協議，取得路徑部分
            const path = decodedUrl.slice(protocol.length);
            return getProtocolPrefix() + path;
          }
        }
        const targetProtocol = getTargetProtocol();
        if (decodedUrl.startsWith(targetProtocol + ':') || decodedUrl.startsWith(targetProtocol + '://')) {
          return decodedUrl;
        }
        return decodedUrl;
      }

      // 格式 2: 路徑格式
      const path = urlObj.pathname.replace('/redirect', '');
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      const queryString = urlObj.search;
      // 使用統一的協議前綴
      return getProtocolPrefix() + normalizedPath + queryString;
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
