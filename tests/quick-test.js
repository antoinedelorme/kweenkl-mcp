// Quick test with real webhook token
import { executeKweenkl } from '../index.js';

async function quickTest() {
  console.log('Testing kweenkl with real webhook token...\n');

  const result = await executeKweenkl({
    webhook_token: "51fa2b2d-2080-4a73-b059-7e67712d93f7",
    message: "kweenkl MCP Server implementation test - Success!",
    title: "MCP Server Test",
    priority: "normal"
  });

  console.log(result.content[0].text);
  console.log('\nTest completed!');
}

quickTest().catch(console.error);
