#!/usr/bin/env node
// Test MCP server as it would be called by Claude

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const serverProcess = spawn('node', ['index.js']);

// Read responses
const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('\n📥 Response:', JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('Non-JSON output:', line);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log('📋 Server log:', data.toString().trim());
});

// Test 1: List tools
console.log('🔧 Test 1: Listing available tools...');
setTimeout(() => {
  serverProcess.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  }) + '\n');
}, 500);

// Test 2: Call kweenkl tool
console.log('\n🔧 Test 2: Calling kweenkl tool...');
setTimeout(() => {
  serverProcess.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "kweenkl",
      arguments: {
        webhook_token: "51fa2b2d-2080-4a73-b059-7e67712d93f7",
        message: "MCP server test from stdio interface!",
        title: "MCP Test",
        priority: "normal"
      }
    }
  }) + '\n');
}, 2000);

// Clean up after tests
setTimeout(() => {
  console.log('\n✅ Tests complete, shutting down server...');
  serverProcess.kill();
  process.exit(0);
}, 4000);
