const STORAGE_KEY = "selectedProtocol";
const DEFAULT_PROTOCOL = "antigravity";

// IDE 選項配置
const IDE_OPTIONS = [
  { id: "vscode", name: "VS Code", desc: "官方穩定版" },
  { id: "vscode-insiders", name: "VS Code Insiders", desc: "開發預覽版" },
  { id: "antigravity", name: "Antigravity", desc: "Antigravity IDE" },
  { id: "cursor", name: "Cursor", desc: "AI-first IDE" },
  { id: "windsurf", name: "Windsurf", desc: "Codeium IDE" },
];

/**
 * 取得目前選擇的 IDE 名稱
 */
async function getCurrentIDEName() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const currentProtocol = result[STORAGE_KEY] || DEFAULT_PROTOCOL;
    const ide = IDE_OPTIONS.find(i => i.id === currentProtocol);
    return ide ? ide.name : "IDE";
  } catch {
    return "IDE";
  }
}

/**
 * 建立右鍵選單
 */
async function createContextMenus() {
  const ideName = await getCurrentIDEName();
  
  // 移除所有現有選單
  chrome.contextMenus.removeAll(() => {
    // ============ VSIX 連結專用選單 ============
    chrome.contextMenus.create({
      id: "install-vsix",
      title: `📦 用 ${ideName} 安裝此擴充套件`,
      contexts: ["link"],
      targetUrlPatterns: ["*://*/*.vsix", "*://*/*.vsix?*"]
    });

    // ============ IDE 選擇選單 ============
    chrome.contextMenus.create({
      id: "ide-switcher-parent",
      title: "🔗 選擇目標 IDE",
      contexts: ["page", "link", "selection"],
    });

    // 建立各 IDE 選項
    IDE_OPTIONS.forEach((ide) => {
      chrome.contextMenus.create({
        id: `ide-${ide.id}`,
        parentId: "ide-switcher-parent",
        title: ide.name,
        type: "radio",
        contexts: ["page", "link", "selection"],
      });
    });

    // 初始化選中狀態
    updateMenuCheckState();
  });
}

/**
 * 更新選單的選中狀態和標題
 */
async function updateMenuCheckState() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const currentProtocol = result[STORAGE_KEY] || DEFAULT_PROTOCOL;
    const ideName = IDE_OPTIONS.find(i => i.id === currentProtocol)?.name || "IDE";

    // 更新 VSIX 安裝選單標題
    chrome.contextMenus.update("install-vsix", {
      title: `📦 用 ${ideName} 安裝此擴充套件`
    });

    // 更新 radio 狀態
    IDE_OPTIONS.forEach((ide) => {
      chrome.contextMenus.update(`ide-${ide.id}`, {
        checked: ide.id === currentProtocol,
      });
    });
  } catch (error) {
    console.error("[IDE Switcher] 更新選單狀態失敗:", error);
  }
}

/**
 * 從 VSIX URL 解析擴充套件資訊
 * 支援 Open VSX 格式: https://open-vsx.org/api/{namespace}/{name}/{version}/file/{name}-{version}.vsix
 */
function parseExtensionFromVsixUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Open VSX 格式: /api/{namespace}/{name}/{version}/file/{filename}.vsix
    const openVsxMatch = urlObj.pathname.match(/\/api\/([^/]+)\/([^/]+)\/[^/]+\/file\//);
    if (openVsxMatch) {
      return {
        publisher: openVsxMatch[1],
        name: openVsxMatch[2]
      };
    }
    
    // 嘗試從檔案名解析: {publisher}.{name}-{version}.vsix
    const filename = urlObj.pathname.split('/').pop();
    const dotMatch = filename.match(/^([^.]+)\.([^-]+)/);
    if (dotMatch) {
      return {
        publisher: dotMatch[1],
        name: dotMatch[2]
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 處理選單項目點擊
 */
async function handleMenuClick(info, tab) {
  const menuId = info.menuItemId;

  // 處理 VSIX 安裝
  if (menuId === "install-vsix" && info.linkUrl) {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const protocol = result[STORAGE_KEY] || DEFAULT_PROTOCOL;
    
    const extInfo = parseExtensionFromVsixUrl(info.linkUrl);
    if (extInfo) {
      const protocolUrl = `${protocol}:extension/${extInfo.publisher}.${extInfo.name}`;
      console.log(`[IDE Switcher] 安裝擴充套件: ${protocolUrl}`);
      
      // 在目前分頁觸發協議
      chrome.tabs.update(tab.id, { url: protocolUrl });
    } else {
      console.warn("[IDE Switcher] 無法解析擴充套件資訊:", info.linkUrl);
    }
    return;
  }

  // 處理 IDE 選擇
  if (menuId.startsWith("ide-")) {
    const protocol = menuId.replace("ide-", "");

    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: protocol });
      console.log(`[IDE Switcher] 已切換至: ${protocol}`);

      // 更新選單狀態
      await updateMenuCheckState();
    } catch (error) {
      console.error("[IDE Switcher] 儲存設定失敗:", error);
    }
  }
}

// 監聽擴充功能安裝/更新
chrome.runtime.onInstalled.addListener(() => {
  console.log("[IDE Switcher] 擴充功能已安裝/更新");
  createContextMenus();
});

// 監聽選單點擊
chrome.contextMenus.onClicked.addListener(handleMenuClick);

// 監聽設定變更（同步選單狀態）
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[STORAGE_KEY]) {
    updateMenuCheckState();
  }
});
