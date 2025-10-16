#!/usr/bin/env node
// Verify all tools are properly defined

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const serverProcess = spawn('node', ['index.js']);

const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity
});

let hasError = false;

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (response.result?.tools) {
      console.log('✅ Server started successfully\n');
      console.log('📋 Available tools:');
      response.result.tools.forEach((tool, i) => {
        console.log(`\n${i + 1}. ${tool.name}`);
        console.log(`   Description: ${tool.description.substring(0, 80)}...`);
        console.log(`   Required params: ${tool.inputSchema.required.join(', ') || 'none'}`);
      });
      console.log(`\n✅ Total tools: ${response.result.tools.length}`);

      if (response.result.tools.length === 1) {
        console.log('\n⚠️  Note: Only 1 tool found (kweenkl). Channel management tools require KWEENKL_DEVICE_TOKEN to be set.');
      } else if (response.result.tools.length === 5) {
        console.log('\n✅ All 5 tools loaded (kweenkl + 4 channel management tools)');
      }

      serverProcess.kill();
      process.exit(0);
    }
  } catch (e) {
    // Ignore non-JSON lines
  }
});

serverProcess.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('Error') || msg.includes('error')) {
    console.error('❌ Error:', msg);
    hasError = true;
  }
});

// Send tools list request
setTimeout(() => {
  serverProcess.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  }) + '\n');
}, 500);

setTimeout(() => {
  if (!hasError) {
    console.log('\n❌ Timeout - no response from server');
  }
  serverProcess.kill();
  process.exit(1);
}, 5000);
