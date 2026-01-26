/**
 * 測試 Native Host 的本地測試腳本
 * 使用方式: node test-host.js
 */

const { spawn } = require('child_process');
const path = require('path');

const hostPath = path.join(__dirname, 'ide-link-host.js');

function sendNativeMessage(message) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [hostPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputBuffer = Buffer.alloc(0);
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      outputBuffer = Buffer.concat([outputBuffer, chunk]);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (stderr) {
        console.error('Stderr:', stderr);
      }

      if (outputBuffer.length < 4) {
        reject(new Error(`No response received, exit code: ${code}`));
        return;
      }

      const length = outputBuffer.readUInt32LE(0);
      const jsonData = outputBuffer.slice(4, 4 + length).toString('utf8');
      
      try {
        resolve(JSON.parse(jsonData));
      } catch (e) {
        reject(new Error(`Failed to parse response: ${jsonData}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    // 發送訊息
    const json = JSON.stringify(message);
    const msgBuffer = Buffer.from(json, 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(msgBuffer.length, 0);
    
    child.stdin.write(header);
    child.stdin.write(msgBuffer);
    child.stdin.end();
  });
}

async function runTests() {
  console.log('=== Testing Native Host ===\n');

  // Test 1: Ping
  console.log('Test 1: Ping');
  try {
    const result = await sendNativeMessage({ action: 'ping' });
    console.log('Result:', result);
    console.log(result.success ? '✅ PASS\n' : '❌ FAIL\n');
  } catch (err) {
    console.error('Error:', err.message);
    console.log('❌ FAIL\n');
  }

  // Test 2: Invalid action
  console.log('Test 2: Invalid action');
  try {
    const result = await sendNativeMessage({ action: 'unknown' });
    console.log('Result:', result);
    console.log(!result.success ? '✅ PASS (expected error)\n' : '❌ FAIL\n');
  } catch (err) {
    console.error('Error:', err.message);
    console.log('❌ FAIL\n');
  }

  // Test 3: Install without params
  console.log('Test 3: Install without extensionId');
  try {
    const result = await sendNativeMessage({ action: 'install', ide: 'antigravity' });
    console.log('Result:', result);
    console.log(!result.success ? '✅ PASS (expected error)\n' : '❌ FAIL\n');
  } catch (err) {
    console.error('Error:', err.message);
    console.log('❌ FAIL\n');
  }

  console.log('=== Tests Complete ===');
}

runTests().catch(console.error);
