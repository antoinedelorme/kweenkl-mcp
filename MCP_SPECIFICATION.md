# kweenkl MCP Server - Complete Specification

## Executive Summary

This document provides a complete specification for building a Model Context Protocol (MCP) server that enables AI assistants to send kweenkl notifications. The verb "kweenkl" means to send a notification using kweenkl.

## 1. Overview

### 1.1 Purpose
Enable AI assistants (Claude, ChatGPT, etc.) to send push notifications through kweenkl using natural language commands.

### 1.2 Philosophy
Notifications should be as simple as a verb. When an AI can "kweenkl" you, it transforms from a conversational tool into an active assistant that can tap you on the shoulder when needed.

### 1.3 Scope
- Implement MCP server exposing `kweenkl` tool
- Support stdio transport for MCP communication
- Integrate with kweenkl webhook API at api.kweenkl.com
- Handle authentication via webhook tokens
- Provide clear error messages and success feedback

## 2. Technical Architecture

### 2.1 Technology Stack
- **Runtime**: Node.js 18+
- **Language**: JavaScript (ES Modules)
- **MCP SDK**: @modelcontextprotocol/sdk v0.5.0+
- **Transport**: stdio (standard input/output)
- **HTTP Client**: Native fetch API

### 2.2 Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

### 2.3 Architecture Diagram
```
┌─────────────────┐
│  AI Assistant   │
│  (Claude, etc)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│  kweenkl MCP    │
│     Server      │
└────────┬────────┘
         │ HTTPS POST
         │
┌────────▼────────┐
│  api.kweenkl    │
│   .com/webhook  │
└────────┬────────┘
         │ APNs
         │
┌────────▼────────┐
│  iOS Device(s)  │
│  with kweenkl   │
└─────────────────┘
```

## 3. MCP Server Implementation

### 3.1 File Structure
```
kweenkl-mcp-server/
├── package.json
├── index.js
├── README.md
├── .env.example
└── tests/
    └── test-kweenkl.js
```

### 3.2 Server Initialization

#### 3.2.1 Server Metadata
```javascript
const server = new Server(
  {
    name: "kweenkl",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

#### 3.2.2 Transport Setup
```javascript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kweenkl MCP server running on stdio");
}
```

### 3.3 Tool Definition

#### 3.3.1 Tool Schema
The server MUST expose exactly one tool named `kweenkl` with the following schema:

```javascript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "kweenkl",
        description: "Send a push notification using kweenkl. The verb 'kweenkl' means to send a notification. Use this to notify users about important events, updates, or information that requires immediate attention.",
        inputSchema: {
          type: "object",
          properties: {
            webhook_token: {
              type: "string",
              description: "The webhook token for your kweenkl channel. Format: UUID-like string. Can be found in the kweenkl iOS app by opening a channel and viewing 'Channel Info'.",
            },
            message: {
              type: "string",
              description: "The notification message content. Should be clear, concise, and actionable. Maximum recommended length: 500 characters for optimal mobile display.",
            },
            title: {
              type: "string",
              description: "Optional title for the notification. Should be brief (max 50 chars recommended). If omitted, only the message will be shown.",
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high"],
              description: "Priority level for the notification. 'high' = urgent/critical alerts, 'normal' = standard updates (default), 'low' = non-urgent information.",
              default: "normal"
            },
            payload: {
              type: "object",
              description: "Optional custom JSON payload for additional metadata. Can include any structured data that your app might process (e.g., action buttons, deep links, custom data).",
            }
          },
          required: ["webhook_token", "message"],
        },
      },
    ],
  };
});
```

#### 3.3.2 Schema Constraints
- `webhook_token`: MUST be a non-empty string, typically UUID format
- `message`: MUST be a non-empty string, recommended max 500 characters
- `title`: OPTIONAL, recommended max 50 characters
- `priority`: OPTIONAL, MUST be one of ["low", "normal", "high"], defaults to "normal"
- `payload`: OPTIONAL, MUST be valid JSON object if provided

### 3.4 Tool Execution

#### 3.4.1 Request Handler
```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "kweenkl") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { webhook_token, message, title, priority, payload } = request.params.arguments;

  // Validate required parameters
  if (!webhook_token || !message) {
    return {
      content: [
        {
          type: "text",
          text: "❌ Error: webhook_token and message are required parameters.",
        },
      ],
      isError: true,
    };
  }

  // Execute kweenkl
  return await executeKweenkl({ webhook_token, message, title, priority, payload });
});
```

#### 3.4.2 API Call Implementation
```javascript
async function executeKweenkl({ webhook_token, message, title, priority, payload }) {
  const KWEENKL_API_URL = "https://api.kweenkl.com";

  try {
    // Construct request body
    const body = {
      message: message,
    };

    if (title) body.title = title;
    if (priority) body.priority = priority;
    if (payload) body.payload = payload;

    // Make API request
    const response = await fetch(
      `${KWEENKL_API_URL}/webhook/${webhook_token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to kweenkl: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }

    // Parse success response
    const result = await response.json();
    const subscribersNotified = result.subscribers_notified || result.subscribersNotified || 0;
    const notificationId = result.notification_id || result.notificationId || "unknown";

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully kweenkled!\n📱 ${subscribersNotified} subscriber(s) notified\n🆔 Notification ID: ${notificationId}`,
        },
      ],
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to kweenkl: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
```

### 3.5 Error Handling

#### 3.5.1 Error Categories
| Error Type | HTTP Status | MCP Response |
|-----------|-------------|--------------|
| Invalid webhook token | 404 | ❌ Failed to kweenkl: Channel not found |
| Missing parameters | 400 | ❌ Error: webhook_token and message are required |
| Network error | N/A | ❌ Failed to kweenkl: Network request failed |
| Invalid JSON payload | 400 | ❌ Failed to kweenkl: Invalid payload format |
| Server error | 500 | ❌ Failed to kweenkl: Server error |

#### 3.5.2 Error Response Format
All errors MUST return:
```javascript
{
  content: [
    {
      type: "text",
      text: "❌ [Error description]",
    },
  ],
  isError: true,
}
```

### 3.6 Success Response Format

#### 3.6.1 Standard Success
```javascript
{
  content: [
    {
      type: "text",
      text: "✅ Successfully kweenkled!\n📱 X subscriber(s) notified\n🆔 Notification ID: [id]",
    },
  ],
}
```

#### 3.6.2 Response Data Mapping
| API Response Field | Display |
|-------------------|---------|
| `subscribers_notified` or `subscribersNotified` | X subscriber(s) notified |
| `notification_id` or `notificationId` | Notification ID: [id] |

## 4. API Integration

### 4.1 Webhook Endpoint
```
POST https://api.kweenkl.com/webhook/{webhook_token}
```

### 4.2 Request Format
```json
{
  "message": "string (required)",
  "title": "string (optional)",
  "priority": "low|normal|high (optional, default: normal)",
  "payload": {
    "custom": "data (optional)"
  }
}
```

### 4.3 Response Format

#### Success (200 OK)
```json
{
  "success": true,
  "notification_id": "uuid-string",
  "subscribers_notified": 5
}
```

#### Error (4xx/5xx)
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### 4.4 Rate Limiting
- Default: No explicit rate limit documented
- Recommended: Implement exponential backoff for retries
- Best practice: Max 1 request per second per webhook token

## 5. Configuration

### 5.1 Environment Variables
```bash
# Optional: Default webhook token for testing
KWEENKL_DEFAULT_TOKEN=your-webhook-token-here

# Optional: API base URL (defaults to https://api.kweenkl.com)
KWEENKL_API_URL=https://api.kweenkl.com

# Optional: Debug mode
KWEENKL_DEBUG=true
```

### 5.2 MCP Client Configuration

#### 5.2.1 Claude Desktop (macOS)
File: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["/absolute/path/to/kweenkl-mcp-server/index.js"],
      "env": {
        "KWEENKL_DEFAULT_TOKEN": "optional-default-token"
      }
    }
  }
}
```

#### 5.2.2 Claude Desktop (Windows)
File: `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["C:\\path\\to\\kweenkl-mcp-server\\index.js"],
      "env": {
        "KWEENKL_DEFAULT_TOKEN": "optional-default-token"
      }
    }
  }
}
```

#### 5.2.3 Other MCP Clients
Consult your MCP client's documentation for stdio server configuration. The server requires:
- Node.js executable
- Path to index.js
- Optional environment variables

## 6. Usage Examples

### 6.1 Basic Usage
```
User: "kweenkl me with 'Hello World'"
AI: I'll send that notification now.
[AI calls kweenkl tool with message="Hello World"]
Response: ✅ Successfully kweenkled! 📱 1 subscriber(s) notified
```

### 6.2 With Title and Priority
```
User: "Send a high priority kweenkl about the server being down"
AI: I'll send a high priority notification.
[AI calls kweenkl tool with message="Server is down", priority="high", title="Alert"]
Response: ✅ Successfully kweenkled! 📱 3 subscriber(s) notified
```

### 6.3 Contextual Notification
```
User: "Analyze this log file and kweenkl me if you find errors"
AI: I'll analyze the log file now.
[AI analyzes file]
AI: Found 5 errors. I'll kweenkl you with the summary.
[AI calls kweenkl with message="Found 5 errors in log: [details]", title="Log Analysis Complete"]
Response: ✅ Successfully kweenkled!
```

### 6.4 Scheduled Notification
```
User: "Every hour, kweenkl me with the current time"
AI: I'll set that up. However, I should note that I can't directly schedule recurring tasks.
You could use Zapier with the Schedule trigger and kweenkl action for this.
For now, I can kweenkl you with the current time: [calls kweenkl]
```

### 6.5 Custom Payload
```
User: "kweenkl me with a link to open the dashboard"
AI: I'll send a notification with a deep link.
[AI calls kweenkl with message="Dashboard updated", payload={"action": "open_dashboard", "url": "https://..."}]
Response: ✅ Successfully kweenkled!
```

## 7. Testing

### 7.1 Unit Tests
```javascript
// tests/test-kweenkl.js
import { executeKweenkl } from '../index.js';

async function testBasicKweenkl() {
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "Test notification"
  });

  console.log(result.content[0].text);
  // Expected: ✅ Successfully kweenkled! or ❌ error
}

async function testWithAllParameters() {
  const result = await executeKweenkl({
    webhook_token: "test-token-123",
    message: "Test notification",
    title: "Test Title",
    priority: "high",
    payload: { test: true }
  });

  console.log(result.content[0].text);
}

testBasicKweenkl();
testWithAllParameters();
```

### 7.2 Integration Tests
1. **Valid webhook token**: Should return success with subscriber count
2. **Invalid webhook token**: Should return 404 error
3. **Missing message**: Should return parameter error
4. **Network error**: Should return network error message
5. **All parameters**: Should accept title, priority, payload

### 7.3 Manual Testing with MCP Inspector
```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run MCP Inspector
mcp-inspector node /path/to/kweenkl-mcp-server/index.js

# Test tool in browser at http://localhost:5173
```

## 8. Deployment

### 8.1 Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Valid kweenkl webhook token for testing

### 8.2 Installation Steps
```bash
# Clone or create project
mkdir kweenkl-mcp-server
cd kweenkl-mcp-server

# Create package.json
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk

# Create index.js (copy implementation from section 3)
# Set executable permission
chmod +x index.js

# Test the server
node index.js
```

### 8.3 MCP Client Setup
1. Locate your MCP client's config file
2. Add kweenkl server configuration
3. Restart MCP client
4. Verify server appears in available tools

### 8.4 Verification
```
Ask AI: "What tools do you have available?"
Expected response should include: "kweenkl - Send a push notification..."
```

## 9. Security Considerations

### 9.1 Webhook Token Protection
- Webhook tokens are SENSITIVE credentials
- Never log webhook tokens in plain text
- Store in environment variables or secure config
- Rotate tokens if compromised

### 9.2 Input Validation
- Validate webhook token format (UUID-like)
- Sanitize message content (prevent injection)
- Validate priority enum values
- Validate payload is valid JSON if provided

### 9.3 Rate Limiting
- Implement client-side rate limiting
- Respect server rate limits (429 responses)
- Use exponential backoff for retries

### 9.4 Error Message Sanitization
- Don't expose sensitive server details in errors
- Log detailed errors to stderr, return generic errors to AI
- Never include webhook tokens in error messages

## 10. Best Practices

### 10.1 Message Composition
- Keep messages under 500 characters
- Front-load important information
- Use actionable language
- Include context when needed

### 10.2 Priority Usage
| Priority | Use Case | Example |
|----------|----------|---------|
| `high` | Urgent alerts requiring immediate action | "Production server down", "Security breach detected" |
| `normal` | Standard notifications and updates | "Build complete", "Report ready" |
| `low` | Nice-to-know information | "Daily summary", "Weekly stats" |

### 10.3 Payload Usage
Use custom payloads for:
- Deep links to specific app screens
- Action buttons (reply, dismiss, open)
- Structured data for client-side processing
- Analytics tracking metadata

Example:
```json
{
  "message": "New comment on your post",
  "payload": {
    "action": "open_post",
    "post_id": "12345",
    "deep_link": "kweenkl://posts/12345",
    "action_buttons": [
      { "label": "Reply", "action": "reply" },
      { "label": "View", "action": "view" }
    ]
  }
}
```

### 10.4 AI Assistant Integration
- Teach AI when to kweenkl (important events only)
- Provide webhook token in system prompt or config
- Use context to craft relevant notifications
- Avoid kweenkl spam - batch updates when appropriate

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Server not appearing in AI | Config file incorrect | Check JSON syntax, file path, restart AI |
| 404 errors | Invalid webhook token | Verify token in kweenkl app |
| No notifications received | Channel not subscribed | Subscribe to channel in iOS app |
| Network errors | Firewall/proxy blocking | Check network, allow api.kweenkl.com |
| JSON parse errors | Invalid payload format | Validate JSON before sending |

### 11.2 Debug Mode
Enable debug logging:
```javascript
const DEBUG = process.env.KWEENKL_DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG) {
    console.error('[kweenkl-debug]', ...args);
  }
}

// Usage
debugLog('Sending kweenkl with:', { message, title, priority });
```

### 11.3 Logging
All logs MUST go to stderr (console.error), NOT stdout:
```javascript
// Correct
console.error('kweenkl MCP server running on stdio');

// WRONG - breaks MCP protocol
console.log('Server started');
```

## 12. Versioning and Updates

### 12.1 Semantic Versioning
- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes

### 12.2 Changelog
Maintain CHANGELOG.md with:
- Version number
- Release date
- Added features
- Fixed bugs
- Breaking changes

## 13. Future Enhancements

### 13.1 Potential Features
- [ ] Batch notifications (multiple messages in one call)
- [ ] Template system for common notification formats
- [ ] Notification scheduling (send later)
- [ ] Rich media support (images, videos)
- [ ] Read receipts and analytics
- [ ] Channel discovery and selection
- [ ] Multi-language support

### 13.2 Advanced Integration
- Webhook signature verification
- OAuth2 authentication for channel management
- Bi-directional communication (notification replies)
- Real-time notification status updates

## 14. Complete Implementation

### 14.1 package.json
```json
{
  "name": "kweenkl-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for kweenkl - allows AI assistants to send notifications",
  "type": "module",
  "main": "index.js",
  "bin": {
    "kweenkl-mcp": "./index.js"
  },
  "scripts": {
    "start": "node index.js",
    "test": "node tests/test-kweenkl.js"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "kweenkl",
    "notifications",
    "ai",
    "claude",
    "push-notifications"
  ],
  "author": "kweenkl",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 14.2 index.js (Complete Implementation)
```javascript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const KWEENKL_API_URL = process.env.KWEENKL_API_URL || "https://api.kweenkl.com";
const DEBUG = process.env.KWEENKL_DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG) {
    console.error('[kweenkl-debug]', ...args);
  }
}

const server = new Server(
  {
    name: "kweenkl",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the kweenkl tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog('Tool list requested');
  return {
    tools: [
      {
        name: "kweenkl",
        description: "Send a push notification using kweenkl. The verb 'kweenkl' means to send a notification. Use this to notify users about important events, updates, or information that requires immediate attention.",
        inputSchema: {
          type: "object",
          properties: {
            webhook_token: {
              type: "string",
              description: "The webhook token for your kweenkl channel. Format: UUID-like string. Can be found in the kweenkl iOS app by opening a channel and viewing 'Channel Info'.",
            },
            message: {
              type: "string",
              description: "The notification message content. Should be clear, concise, and actionable. Maximum recommended length: 500 characters for optimal mobile display.",
            },
            title: {
              type: "string",
              description: "Optional title for the notification. Should be brief (max 50 chars recommended). If omitted, only the message will be shown.",
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high"],
              description: "Priority level for the notification. 'high' = urgent/critical alerts, 'normal' = standard updates (default), 'low' = non-urgent information.",
            },
            payload: {
              type: "object",
              description: "Optional custom JSON payload for additional metadata. Can include any structured data that your app might process (e.g., action buttons, deep links, custom data).",
            }
          },
          required: ["webhook_token", "message"],
        },
      },
    ],
  };
});

// Execute kweenkl notification
async function executeKweenkl({ webhook_token, message, title, priority, payload }) {
  debugLog('Executing kweenkl:', { message, title, priority, hasPayload: !!payload });

  try {
    // Construct request body
    const body = {
      message: message,
    };

    if (title) body.title = title;
    if (priority) body.priority = priority;
    if (payload) body.payload = payload;

    debugLog('Request body:', body);

    // Make API request
    const response = await fetch(
      `${KWEENKL_API_URL}/webhook/${webhook_token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    debugLog('Response status:', response.status);

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      debugLog('Error response:', errorMessage);

      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to kweenkl: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }

    // Parse success response
    const result = await response.json();
    const subscribersNotified = result.subscribers_notified || result.subscribersNotified || 0;
    const notificationId = result.notification_id || result.notificationId || "unknown";

    debugLog('Success:', { subscribersNotified, notificationId });

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully kweenkled!\n📱 ${subscribersNotified} subscriber(s) notified\n🆔 Notification ID: ${notificationId}`,
        },
      ],
    };

  } catch (error) {
    debugLog('Exception:', error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to kweenkl: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

// Handle kweenkl tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  debugLog('Tool call requested:', request.params.name);

  if (request.params.name !== "kweenkl") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { webhook_token, message, title, priority, payload } = request.params.arguments;

  // Validate required parameters
  if (!webhook_token || !message) {
    return {
      content: [
        {
          type: "text",
          text: "❌ Error: webhook_token and message are required parameters.",
        },
      ],
      isError: true,
    };
  }

  // Validate priority if provided
  if (priority && !['low', 'normal', 'high'].includes(priority)) {
    return {
      content: [
        {
          type: "text",
          text: "❌ Error: priority must be one of: low, normal, high",
        },
      ],
      isError: true,
    };
  }

  // Execute kweenkl
  return await executeKweenkl({ webhook_token, message, title, priority, payload });
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kweenkl MCP server running on stdio");
  debugLog('Debug mode enabled');
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 14.3 README.md
```markdown
# kweenkl MCP Server

MCP (Model Context Protocol) server that allows AI assistants to send kweenkl notifications.

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

### Claude Desktop (macOS)
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

\`\`\`json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["/absolute/path/to/kweenkl-mcp-server/index.js"]
    }
  }
}
\`\`\`

### Claude Desktop (Windows)
Edit: `%APPDATA%\\Claude\\claude_desktop_config.json`

## Usage

Once configured, ask your AI assistant:

- "kweenkl me when you're done"
- "Send a high priority kweenkl about the deployment"
- "kweenkl the team with the summary"

## Getting Your Webhook Token

1. Open kweenkl iOS app
2. Open a channel
3. Tap info icon
4. Copy webhook token

## Environment Variables

- `KWEENKL_API_URL` - API base URL (default: https://api.kweenkl.com)
- `KWEENKL_DEBUG` - Enable debug logging (set to 'true')

## Philosophy

The verb "kweenkl" means to send a notification using kweenkl.

## License

MIT
```

### 14.4 .env.example
```bash
# Optional: Default webhook token for testing
# KWEENKL_DEFAULT_TOKEN=your-webhook-token-here

# Optional: API base URL (defaults to https://api.kweenkl.com)
# KWEENKL_API_URL=https://api.kweenkl.com

# Optional: Debug mode
# KWEENKL_DEBUG=true
```

## 15. Acceptance Criteria

### 15.1 Functional Requirements
- ✅ Server starts successfully with stdio transport
- ✅ Lists `kweenkl` tool when requested by AI
- ✅ Accepts webhook_token and message (required)
- ✅ Accepts title, priority, payload (optional)
- ✅ Validates priority enum values
- ✅ Makes HTTP POST to api.kweenkl.com/webhook/{token}
- ✅ Returns success with subscriber count
- ✅ Returns errors with clear messages
- ✅ Handles network errors gracefully

### 15.2 Non-Functional Requirements
- ✅ Response time < 2 seconds for API call
- ✅ Clear error messages for debugging
- ✅ All logs to stderr (not stdout)
- ✅ No sensitive data in logs
- ✅ Node.js 18+ compatibility
- ✅ ES Modules syntax

### 15.3 Documentation Requirements
- ✅ Complete README with setup instructions
- ✅ Example configurations for Claude Desktop
- ✅ Usage examples with different parameters
- ✅ Troubleshooting guide
- ✅ API reference

## 16. Glossary

| Term | Definition |
|------|------------|
| **kweenkl** | (verb) To send a notification using the kweenkl platform |
| **MCP** | Model Context Protocol - standard for AI tool integration |
| **Webhook Token** | Authentication token for sending to a specific channel |
| **stdio** | Standard input/output transport for MCP communication |
| **Priority** | Notification urgency level (low, normal, high) |
| **Payload** | Custom JSON data attached to notification |
| **Subscriber** | User who receives notifications from a channel |

## 17. References

- MCP Documentation: https://modelcontextprotocol.io
- kweenkl API: https://api.kweenkl.com
- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Claude Desktop Config: https://claude.ai/docs

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Author**: kweenkl team
**Status**: COMPLETE - Ready for Implementation
