/**
 * VS Code IDE Switcher - Content Script
 * 
 * 攔截 vscode:// 和 vscode-insiders:// 協議連結，
 * 根據用戶設定轉換為目標 IDE 協議。
 * 
 * 支援兩種攔截方式：
 * 1. 標準 <a> 連結點擊
 * 2. JavaScript 動態觸發的協議導航（如 GitHub MCP）
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'selectedProtocol';
  const DEFAULT_PROTOCOL = 'antigravity';

  const SUPPORTED_PROTOCOLS = new Set([
    'vscode',
    'vscode-insiders',
    'antigravity',
    'cursor',
    'windsurf'
  ]);

  // 支援攔截的 IDE 協議前綴（包含競爭 IDE）
  const VSCODE_PROTOCOLS = [
    'vscode:',
    'vscode-insiders:',
    'antigravity:',
    'cursor:',
    'windsurf:',
    'vscodium:'
  ];

  // 支援攔截的 vscode.dev 重定向網址模式 (GitHub MCP 使用)
  const VSCODE_DEV_REDIRECT_PATTERNS = [
    'vscode.dev/redirect',
    'insiders.vscode.dev/redirect'
  ];

  const VSCODE_EXTENSION_SCHEMES = new Set(['vscode', 'vscode-insiders']);

  // 避免破壞 OAuth/登入流程（例如 GitHub Copilot / GitHub Auth 回呼）
  // 典型回呼：vscode://vscode.github-authentication/did-authenticate?code=...&state=...
  function isAuthCallbackUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const match = url.match(/^([^:]+):\/\/([^/]+)\//) || url.match(/^([^:]+):([^/]+)\//);
    const provider = (match?.[2] || '').toLowerCase();
    return provider.includes('authentication');
  }

  /**
   * 取得協議前綴
   * Antigravity 使用 antigravity:// 格式（有雙斜線）
   * 其他 IDE 使用 protocol: 格式（無雙斜線）
   */
  function getProtocolPrefix() {
    return targetProtocol === 'antigravity' ? `${targetProtocol}://` : `${targetProtocol}:`;
  }

  // 當前選擇的目標協議
  let targetProtocol = DEFAULT_PROTOCOL;

  /**
   * 從 storage 載入用戶設定（含遷移邏輯）
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY);
      let protocol = result[STORAGE_KEY] || DEFAULT_PROTOCOL;
      if (!SUPPORTED_PROTOCOLS.has(protocol)) {
        console.log(`[IDE Switcher] 修正協議: ${protocol} -> ${DEFAULT_PROTOCOL}`);
        await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_PROTOCOL });
        protocol = DEFAULT_PROTOCOL;
      }

      targetProtocol = protocol;
      console.log(`[IDE Switcher] 目標 IDE: ${targetProtocol}`);
    } catch (error) {
      console.error('[IDE Switcher] 載入設定失敗:', error);
      targetProtocol = DEFAULT_PROTOCOL;
    }
  }

  /**
   * 更新攔截器狀態 (傳遞給 Main World 的 interceptor.js)
   */
  function updateInterceptorState() {
    document.documentElement.dataset.ideTargetProtocol = targetProtocol;
  }

  /**
   * 監聽設定變更
   */
  function listenForSettingsChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes[STORAGE_KEY]) {
        const nextProtocol = changes[STORAGE_KEY].newValue || DEFAULT_PROTOCOL;
        targetProtocol = SUPPORTED_PROTOCOLS.has(nextProtocol) ? nextProtocol : DEFAULT_PROTOCOL;
        console.log(`[IDE Switcher] 設定已更新，目標 IDE: ${targetProtocol}`);
        // 更新 dataset 供 interceptor.js 讀取
        updateInterceptorState();
      }
    });
  }

  /**
   * 檢查 URL 是否為 VS Code 協議
   */
  function isVSCodeUrl(url) {
    if (!url) return false;
    return VSCODE_PROTOCOLS.some(protocol => url.startsWith(protocol));
  }

  /**
   * 檢查 URL 是否為 vscode.dev 重定向連結 (GitHub MCP 使用)
   */
  function isVSCodeDevRedirectUrl(url) {
    if (!url) return false;
    return VSCODE_DEV_REDIRECT_PATTERNS.some(pattern => url.includes(pattern));
  }

  /**
   * 判斷是否為 VSIX 下載連結
   */
  function isVsixUrl(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return false;
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();

      if (pathname.endsWith('.vsix')) return true;

      if (hostname === 'open-vsx.org' || hostname.endsWith('.open-vsx.org')) {
        if (/^\/api\/[^/]+\/[^/]+\/[^/]+\/file/.test(pathname)) return true;
      }

      if (hostname.endsWith('.gallery.vsassets.io')) {
        if (/^\/_apis\/public\/gallery\/publisher\/[^/]+\/extension\/[^/]+\/[^/]+\/assetbyname\//.test(pathname)) {
          return true;
        }
      }

      if (hostname === 'marketplace.visualstudio.com') {
        if (/^\/_apis\/public\/gallery\/publishers\/[^/]+\/vsextensions\/[^/]+\/[^/]+\/vspackage$/.test(pathname)) {
          return true;
        }
      }

      if (hostname === 'github.com') {
        if (/^\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/.+\.vsix$/.test(pathname)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 從 VSIX URL 解析擴充套件資訊
   */
  function parseExtensionFromVsixUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.endsWith('.gallery.vsassets.io')) {
        const vsAssetsMatch = urlObj.pathname.match(
          /^\/_apis\/public\/gallery\/publisher\/([^/]+)\/extension\/([^/]+)\/([^/]+)\/assetbyname\/.+$/
        );
        if (vsAssetsMatch) {
          return { publisher: vsAssetsMatch[1], name: vsAssetsMatch[2], version: vsAssetsMatch[3] };
        }
      }

      if (hostname === 'marketplace.visualstudio.com') {
        const marketplaceMatch = urlObj.pathname.match(
          /^\/_apis\/public\/gallery\/publishers\/([^/]+)\/vsextensions\/([^/]+)\/([^/]+)\/vspackage$/
        );
        if (marketplaceMatch) {
          return { publisher: marketplaceMatch[1], name: marketplaceMatch[2], version: marketplaceMatch[3] };
        }
      }

      const openVsxMatch = urlObj.pathname.match(/^\/api\/([^/]+)\/([^/]+)\/([^/]+)\/file(?:\/([^/]+))?$/);
      if (openVsxMatch) {
        return { publisher: openVsxMatch[1], name: openVsxMatch[2], version: openVsxMatch[3] };
      }

      const filename = urlObj.pathname.split('/').pop();
      if (filename) {
        const vsixMatch = filename.match(/^(.+)\.vsix$/i);
        if (vsixMatch) {
          const baseName = vsixMatch[1];
          const lastDash = baseName.lastIndexOf('-');
          const namePart = lastDash > 0 ? baseName.slice(0, lastDash) : baseName;
          const version = lastDash > 0 ? baseName.slice(lastDash + 1) : null;
          const dotIndex = namePart.indexOf('.');
          if (dotIndex > 0) {
            return {
              publisher: namePart.slice(0, dotIndex),
              name: namePart.slice(dotIndex + 1),
              version: version || undefined
            };
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 依照規範建立 VSIX 安裝協議 URL
   */
  function buildVsixInstallUrl(protocol, vsixUrl, extInfo) {
    const params = new URLSearchParams({ url: vsixUrl });
    if (extInfo?.publisher && extInfo?.name) {
      params.set('name', `${extInfo.publisher}.${extInfo.name}`);
    }
    if (extInfo?.version) {
      params.set('version', extInfo.version);
    }
    return `${protocol}://extension/install?${params.toString()}`;
  }

  function parseVSCodeExtensionId(url) {
    const match = url.match(/^([^:]+):(\/\/)?extension\/([^?#]+)/);
    if (!match) return null;
    const scheme = match[1];
    if (!VSCODE_EXTENSION_SCHEMES.has(scheme)) return null;
    return match[3];
  }

  /**
   * 將 vscode.dev 重定向連結轉換為目標 IDE 協議
   * 
   * 支援兩種格式：
   * 格式 1: https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F...
   *         (GitHub MCP Registry 使用此格式，url 參數包含完整 vscode: 連結)
   * 格式 2: https://insiders.vscode.dev/redirect/mcp/install?name=github&config={...}
   *         (路徑格式)
   */
  function convertVSCodeDevToProtocol(url) {
    try {
      const urlObj = new URL(url);

      // 格式 1: 檢查是否有 url 參數（GitHub MCP Registry 使用）
      const urlParam = urlObj.searchParams.get('url');
      if (urlParam) {
        // 解碼 url 參數，取得實際的 vscode: 連結
        const decodedUrl = decodeURIComponent(urlParam);
        console.log(`[IDE Switcher] 解碼的 vscode 連結: ${decodedUrl}`);

        // OAuth/登入回呼不轉換，避免破壞 IDE 的認證流程
        if (isAuthCallbackUrl(decodedUrl)) {
          console.log('[IDE Switcher] 偵測到認證回呼連結，略過轉換');
          return decodedUrl;
        }

        // 替換協議 (vscode: 或 vscode-insiders: → 目標協議)
        for (const protocol of VSCODE_PROTOCOLS) {
          if (decodedUrl.startsWith(protocol)) {
            // 移除來源協議，取得路徑部分
            const path = decodedUrl.slice(protocol.length);
            return `${getProtocolPrefix()}${path}`;
          }
        }
        // 如果已經是目標協議，直接返回
        if (decodedUrl.startsWith(`${targetProtocol}:`) || decodedUrl.startsWith(`${targetProtocol}://`)) {
          return decodedUrl;
        }
        return decodedUrl;
      }

      // 格式 2: 路徑格式 (/redirect/mcp/install?...)
      const path = urlObj.pathname.replace('/redirect', '');
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      const queryString = urlObj.search;
      // 所有路徑都使用統一的協議前綴
      return `${getProtocolPrefix()}${normalizedPath}${queryString}`;
    } catch (error) {
      console.error('[IDE Switcher] 轉換 vscode.dev 連結失敗:', error);
      return null;
    }
  }

  /**
   * 將 VS Code URL 轉換為目標協議 URL
   */
  function convertToTargetUrl(url) {
    // OAuth/登入回呼不轉換，避免破壞 IDE 的認證流程
    if (isAuthCallbackUrl(url)) {
      return url;
    }
    // 已經是目標協議
    if (url.startsWith(`${targetProtocol}:`) || url.startsWith(`${targetProtocol}://`)) {
      return url;
    }
    // 替換來源協議為目標協議
    for (const protocol of VSCODE_PROTOCOLS) {
      if (url.startsWith(protocol)) {
        // 移除來源協議，取得路徑部分
        const path = url.slice(protocol.length);
        // 根據目標協議格式重建 URL
        return `${getProtocolPrefix()}${path}`;
      }
    }
    return url;
  }

  /**
   * 處理連結點擊事件
   */
  async function handleClick(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || link.href;

    // OAuth/登入回呼不攔截，避免 GitHub Copilot 登入失敗
    if (isAuthCallbackUrl(href)) return;

    // 處理 VS Code Marketplace 安裝連結 (vscode:extension/...)
    // 注意：所有 VS Code 系列 IDE 都支援 {protocol}:extension/{id} 格式開啟擴充頁面
    // 但不支援自動安裝，用戶需要在 IDE 內點擊「安裝」按鈕
    const extensionId = parseVSCodeExtensionId(href);
    if (extensionId) {
      // 如果目標協議就是原始協議，不需要轉換
      if (VSCODE_EXTENSION_SCHEMES.has(targetProtocol) && href.startsWith(`${targetProtocol}:`)) {
        return; // 讓瀏覽器正常處理
      }

      event.preventDefault();
      event.stopPropagation();

      console.log(`[IDE Switcher] 攔截擴充連結: ${href}`);
      console.log(`[IDE Switcher] 擴充功能 ID: ${extensionId}`);
      
      // 嘗試透過 Native Host 安裝（適用於 Antigravity 等不支援 protocol URL 的 IDE）
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'installExtension',
          extensionId: extensionId
        });
        
        if (response && response.success) {
          console.log('[IDE Switcher] 擴充功能安裝成功');
         } else if (response && response.error === 'Native Host not installed') {
           // Native Host 未安裝，回退到 protocol URL
           console.log('[IDE Switcher] Native Host 未安裝，嘗試使用 protocol URL');
           const protocolUrl = targetProtocol === 'antigravity' 
             ? `antigravity://${extensionId}` 
             : `${getProtocolPrefix()}extension/${extensionId}`;
           console.log(`[IDE Switcher] 重定向至: ${protocolUrl}`);
           window.location.href = protocolUrl;
        } else {
          console.error('[IDE Switcher] 安裝失敗:', response?.error);
        }
       } catch (err) {
         // 通訊失敗，回退到 protocol URL
         console.error('[IDE Switcher] 無法連接 background script:', err);
         const protocolUrl = targetProtocol === 'antigravity' 
           ? `antigravity://${extensionId}` 
           : `${getProtocolPrefix()}extension/${extensionId}`;
         console.log(`[IDE Switcher] 回退到 protocol URL: ${protocolUrl}`);
         window.location.href = protocolUrl;
      }
      return;
    }

    // 處理 vscode.dev 重定向連結 (GitHub MCP 使用)
    if (isVSCodeDevRedirectUrl(href)) {
      const targetUrl = convertVSCodeDevToProtocol(href);
      if (!targetUrl) return;

      event.preventDefault();
      event.stopPropagation();

      console.log(`[IDE Switcher] 攔截 vscode.dev 連結: ${href}`);
      console.log(`[IDE Switcher] 重定向至: ${targetUrl}`);

      window.location.href = targetUrl;
      return;
    }

    // 處理 VSIX 下載連結 (Open VSX / Marketplace / GitHub Releases / *.vsix)
    if (isVsixUrl(href)) {
      const extInfo = parseExtensionFromVsixUrl(href);
      const protocolUrl = buildVsixInstallUrl(targetProtocol, href, extInfo);

      event.preventDefault();
      event.stopPropagation();

      console.log(`[IDE Switcher] 攔截 VSIX 下載: ${href}`);
      console.log(`[IDE Switcher] 重定向至: ${protocolUrl}`);

      window.location.href = protocolUrl;
      return;
    }

    // 處理標準 vscode:// 協議連結
    if (!isVSCodeUrl(href)) return;

    const targetUrl = convertToTargetUrl(href);
    if (targetUrl === href) {
      console.log(`[IDE Switcher] 保持原連結: ${href}`);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    console.log(`[IDE Switcher] 攔截連結: ${href}`);
    console.log(`[IDE Switcher] 重定向至: ${targetUrl}`);

    window.location.href = targetUrl;
  }

  /**
   * 處理動態添加的連結
   */
  function observeNewLinks() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const links = node.querySelectorAll ?
                node.querySelectorAll('a[href^="vscode:"], a[href^="vscode-insiders:"], a[href^="cursor:"], a[href^="windsurf:"], a[href^="vscodium:"]') : [];

              links.forEach(link => {
                if (!link.dataset.ideSwitcherProcessed) {
                  link.dataset.ideSwitcherProcessed = 'true';
                }
              });
            }
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 初始化
   */
  async function init() {
    await loadSettings();
    updateInterceptorState(); // 初始化 dataset
    listenForSettingsChanges();

    // 監聯連結點擊（攔截標準 <a> 連結）
    document.addEventListener('click', handleClick, true);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeNewLinks);
    } else {
      observeNewLinks();
    }

    console.log('[IDE Switcher] 擴充功能已載入');
  }

  init();
})();
