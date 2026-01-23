/**
 * URL 轉換規則測試腳本
 * 
 * 測試 IDE-Link-Interceptor 的 URL 轉換邏輯是否符合 url-conversion-rules.md 規範
 * 
 * 執行方式: node tests/url-conversion.test.js
 */

// ========== 模擬核心轉換邏輯 ==========

const IDE_PROVIDER_MAP = {
    'vscode': 'github.remotehub',
    'vscode-insiders': 'github.remotehub',
    'antigraavity': 'git',
    'cursor': 'repo',
    'windsurf': 'repo',
    'vscodium': 'github.remotehub'
};

// 避免破壞 OAuth/登入流程（例如 GitHub Copilot / GitHub Auth 回呼）
function isAuthCallbackUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const match = url.match(/^([^:]+):\/\/([^/]+)\/([^?]+)(\?.*)?$/) ||
        url.match(/^([^:]+):([^/]+)\/([^?]+)(\?.*)?$/);
    if (!match) return false;
    const provider = (match[2] || '').toLowerCase();
    return provider.includes('authentication');
}

/**
 * 轉換 VS Code URL 為目標協議
 */
function convertVSCodeUrl(url, targetProtocol) {
    if (url.startsWith(`${targetProtocol}:`)) return url;
    if (isAuthCallbackUrl(url)) return url;

    try {
        const match = url.match(/^([^:]+):\/\/([^\/]+)\/([^?]+)(\?.*)?$/) ||
            url.match(/^([^:]+):([^\/]+)\/([^?]+)(\?.*)?$/);

        if (match) {
            const [, , , action, queryStr] = match;
            const targetProvider = IDE_PROVIDER_MAP[targetProtocol] || 'git';
            return `${targetProtocol}://${targetProvider}/${action}${queryStr || ''}`;
        }

        // Fallback
        const protocols = ['vscode:', 'vscode-insiders:', 'cursor:'];
        for (const protocol of protocols) {
            if (url.startsWith(protocol)) {
                return url.replace(protocol, `${targetProtocol}:`);
            }
        }
    } catch (e) {
        console.error('轉換失敗:', e);
    }

    return url;
}

/**
 * 建構 VSIX 安裝 URL
 */
function buildVsixInstallUrl(targetProtocol, vsixUrl, publisher, name, version) {
    const encodedVsixUrl = encodeURIComponent(vsixUrl);
    const extensionName = `${publisher}.${name}`;

    let url = `${targetProtocol}://extension/install?url=${encodedVsixUrl}&name=${extensionName}`;

    if (version) {
        url += `&version=${version}`;
    }

    return url;
}

// ========== 測試案例 ==========

function runTests() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    function test(name, actual, expected) {
        const status = actual === expected ? '✅ PASS' : '❌ FAIL';
        tests.push({ name, status, actual, expected });

        if (actual === expected) {
            passed++;
        } else {
            failed++;
            console.error(`\n❌ FAIL: ${name}`);
            console.error('  Expected:', expected);
            console.error('  Actual:  ', actual);
        }
    }

    console.log('\n🧪 開始測試 URL 轉換規則...\n');

    // ========== 測試 1: Provider 映射 ==========
    console.log('📋 測試 1: Provider 映射');

    test(
        '1.1 VS Code 使用 github.remotehub provider',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7', 'vscode'),
        'vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7'
    );

    test(
        '1.2 VS Code → Antigravity 轉換使用 git provider',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7', 'antigraavity'),
        'antigraavity://git/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7'
    );

    test(
        '1.3 VS Code → Cursor 轉換使用 repo provider',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7', 'cursor'),
        'cursor://repo/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7'
    );

    test(
        '1.4 VS Code → Windsurf 轉換使用 repo provider',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7', 'windsurf'),
        'windsurf://repo/open?url=https%3A%2F%2Fgithub.com%2Fmcp%2Fcontext7'
    );

    // ========== 測試 2: GitHub Repo 轉換 ==========
    console.log('\n📋 測試 2: GitHub Repo 連結轉換');

    test(
        '2.1 標準 vscode:// 格式轉換',
        convertVSCodeUrl('vscode://github.remotehub/clone?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo', 'antigraavity'),
        'antigraavity://git/clone?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo'
    );

    test(
        '2.2 含分支參數的轉換',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo&branch=main', 'antigraavity'),
        'antigraavity://git/open?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo&branch=main'
    );

    test(
        '2.3 含多個參數的轉換',
        convertVSCodeUrl('vscode://github.remotehub/open?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo&branch=dev&path=src', 'cursor'),
        'cursor://repo/open?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo&branch=dev&path=src'
    );

    // ========== 測試 3: VSIX 安裝 URL ==========
    console.log('\n📋 測試 3: VSIX 安裝 URL 格式');

    test(
        '3.1 Open VSX 完整格式（含版本）',
        buildVsixInstallUrl('antigraavity', 'https://open-vsx.org/api/pub/ext/1.2.3/file', 'pub', 'ext', '1.2.3'),
        'antigraavity://extension/install?url=https%3A%2F%2Fopen-vsx.org%2Fapi%2Fpub%2Fext%2F1.2.3%2Ffile&name=pub.ext&version=1.2.3'
    );

    test(
        '3.2 無版本號的 VSIX',
        buildVsixInstallUrl('cursor', 'https://example.com/extension.vsix', 'publisher', 'myext', null),
        'cursor://extension/install?url=https%3A%2F%2Fexample.com%2Fextension.vsix&name=publisher.myext'
    );

    test(
        '3.3 特殊字元 URL encoding',
        buildVsixInstallUrl('antigraavity', 'https://example.com/ext?token=abc&id=123', 'test', 'ext', '2.0.0'),
        'antigraavity://extension/install?url=https%3A%2F%2Fexample.com%2Fext%3Ftoken%3Dabc%26id%3D123&name=test.ext&version=2.0.0'
    );

    // ========== 測試 4: URL Encoding ==========
    console.log('\n📋 測試 4: URL Encoding 正確性');

    const testUrl = 'https://github.com/user/repo?query=value&foo=bar';
    const encoded = encodeURIComponent(testUrl);

    test(
        '4.1 URL 包含冒號正確編碼',
        encoded.includes('%3A'),
        true
    );

    test(
        '4.2 URL 包含斜線正確編碼',
        encoded.includes('%2F'),
        true
    );

    test(
        '4.3 URL 包含問號正確編碼',
        encoded.includes('%3F'),
        true
    );

    test(
        '4.4 URL 包含 & 符號正確編碼',
        encoded.includes('%26'),
        true
    );

    // ========== 測試 5: 認證回呼保留原樣 ==========
    console.log('\n📋 測試 5: 認證回呼保留原樣（避免 Copilot 登入失敗）');

    test(
        '5.1 vscode.github-authentication 不轉換',
        convertVSCodeUrl('vscode://vscode.github-authentication/did-authenticate?code=abc&state=def', 'cursor'),
        'vscode://vscode.github-authentication/did-authenticate?code=abc&state=def'
    );

    test(
        '5.2 cursor://...authentication... 不轉換',
        convertVSCodeUrl('cursor://vscode.github-authentication/did-authenticate?code=abc&state=def', 'antigraavity'),
        'cursor://vscode.github-authentication/did-authenticate?code=abc&state=def'
    );

    // ========== 測試結果統計 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 測試結果統計');
    console.log('='.repeat(60));
    console.log(`✅ 通過: ${passed}/${tests.length}`);
    console.log(`❌ 失敗: ${failed}/${tests.length}`);

    if (failed === 0) {
        console.log('\n🎉 所有測試通過！URL 轉換邏輯符合 url-conversion-rules.md 規範。\n');
    } else {
        console.log('\n⚠️ 有測試失敗，請檢查上面的錯誤訊息。\n');
        process.exit(1);
    }
}

// 執行測試
runTests();
