// tests/test-kweenkl.js
import { executeKweenkl } from '../index.js';

async function testBasicKweenkl() {
  console.log('\n=== Testing Basic kweenkl ===');
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "Test notification"
  });

  console.log(result.content[0].text);
  // Expected: ✅ Successfully kweenkled! or ❌ error (depending on token validity)
}

async function testWithAllParameters() {
  console.log('\n=== Testing kweenkl with All Parameters ===');
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "Test notification with all parameters",
    title: "Test Title",
    priority: "high",
    payload: { test: true, timestamp: Date.now() }
  });

  console.log(result.content[0].text);
}

async function testMissingToken() {
  console.log('\n=== Testing Missing Token (should fail validation) ===');
  const result = await executeKweenkl({
    webhook_token: "",
    message: "Test notification"
  });

  console.log(result.content[0].text);
  // Expected: Should show error about missing token
}

async function testWithTitle() {
  console.log('\n=== Testing with Title ===');
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "This notification has a title",
    title: "Important Update"
  });

  console.log(result.content[0].text);
}

async function testWithPriority() {
  console.log('\n=== Testing with High Priority ===');
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "High priority notification",
    priority: "high"
  });

  console.log(result.content[0].text);
}

async function runTests() {
  console.log('Starting kweenkl MCP Server Tests...');
  console.log('Note: These tests will make actual API calls to api.kweenkl.com');
  console.log('Use a valid webhook token to see successful notifications.\n');

  try {
    await testBasicKweenkl();
    await testWithAllParameters();
    await testMissingToken();
    await testWithTitle();
    await testWithPriority();

    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('\n=== Test Error ===');
    console.error(error);
  }
}

runTests();
