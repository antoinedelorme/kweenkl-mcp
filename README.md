<div align="center">

# kweenkl MCP Server

[![LobeHub][lobehub-shield]][lobehub-url]
[![License][license-shield]][license-url]
[![Node Version][node-shield]][node-url]

**Let your AI assistant send you push notifications**

[Quick Start](#installation) · [Features](#tools-available) · [Documentation](#usage) · [Examples](#example-interactions)

</div>

---

> **🚀 PRE-LAUNCH:** kweenkl is currently in pre-launch mode. Join our early access program to get notifications from your AI assistant!

MCP (Model Context Protocol) server that enables AI assistants (Claude, etc.) to send real-time push notifications through kweenkl.

## ✨ What is kweenkl?

The verb "kweenkl" means to send a notification using kweenkl. When an AI can "kweenkl" you, it transforms from a conversational tool into an active assistant that can tap you on the shoulder when needed.

## 🎯 Key Features

- 📱 **Push Notifications**: Send real-time notifications from your AI to your phone
- 🔧 **Channel Management**: Create, list, update, and delete notification channels
- ⚡ **Priority Levels**: Set notification priority (low, normal, high)
- 🎨 **Customization**: Add titles, custom payloads, and metadata
- 🔒 **Secure**: Token-based authentication
- 🚀 **Easy Setup**: Works with Claude Desktop and other MCP clients

## 🆓 Pre-Launch Access

kweenkl is currently in pre-launch. During this phase:
- ✅ The service is fully functional and ready to use
- 🎁 We're gathering feedback from early adopters
- 🚀 Official launch coming soon with more features

**Try it now with our demo webhook token:** `51fa2b2d-2080-4a73-b059-7e67712d93f7`

## 📦 Installation

### Method 1: NPX (Recommended)

Use directly without installation:

```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "npx",
      "args": ["-y", "kweenkl-mcp-server"]
    }
  }
}
```

### Method 2: Clone & Install

```bash
git clone https://github.com/antoinedelorme/kweenkl-mcp.git
cd kweenkl-mcp
npm install
```

## ⚙️ Configuration

### Claude Desktop (macOS)
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Basic setup (notifications only):**
```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["/absolute/path/to/kweenkl-mcp-server/index.js"]
    }
  }
}
```

**With channel management (recommended):**
```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["/absolute/path/to/kweenkl-mcp-server/index.js"],
      "env": {
        "KWEENKL_DEVICE_TOKEN": "your-device-token-here"
      }
    }
  }
}
```

### Claude Desktop (Windows)
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kweenkl": {
      "command": "node",
      "args": ["C:\\path\\to\\kweenkl-mcp-server\\index.js"]
    }
  }
}
```

### Other MCP Clients

Consult your MCP client's documentation for stdio server configuration. The server requires:
- Node.js executable
- Path to index.js
- Optional environment variables

### 🌐 Remote MCP Server

For clients that support HTTP Streamable MCP transport (like n8n, ChatGPT, or other automation tools), you can use our hosted MCP server instead of running a local one.

**Endpoint:** `https://api.kweenkl.com/mcp`

**Authentication:**
- For full access (channel management): Include `X-Kweenkl-Device-Token` header with your device token
- For ChatGPT: Use OAuth flow (contact us for setup)

This allows AI workflows and assistants to send kweenkl notifications without local installation. The remote server supports all the same tools as the local version.

**Example n8n configuration:**
```
MCP Server URL: https://api.kweenkl.com/mcp
Headers: X-Kweenkl-Device-Token: your-device-token
```

## 💬 Usage

Once configured, simply ask your AI assistant natural questions like:

```
💡 "kweenkl me when you're done"
💡 "Send a high priority kweenkl about the deployment"
💡 "kweenkl the team with the summary"
💡 "Analyze this log file and kweenkl me if you find errors"
```

### 📝 Example Interactions

**Basic notification:**
```
User: "kweenkl me with 'Hello World'"
AI: I'll send that notification now.
Response: ✅ Successfully kweenkled! 📱 1 subscriber(s) notified
```

**With priority:**
```
User: "Send a high priority kweenkl about the server being down"
AI: I'll send a high priority notification.
Response: ✅ Successfully kweenkled! 📱 3 subscriber(s) notified
```

**Contextual notification:**
```
User: "Analyze this log file and kweenkl me if you find errors"
AI: I'll analyze the log file now.
[AI analyzes file and finds errors]
AI: Found 5 errors. I'll kweenkl you with the summary.
Response: ✅ Successfully kweenkled!
```

## Getting Your Webhook Token

### Option 1: Use Demo Token (Pre-Launch)
Try kweenkl immediately with our demo webhook token:
```
51fa2b2d-2080-4a73-b059-7e67712d93f7
```

This demo token lets you test the service right away. Notifications sent to this token will be delivered to the kweenkl team's test channel.

### Option 2: Get Your Own Token
1. Open kweenkl iOS app (join our TestFlight for pre-launch access)
2. Open a channel
3. Tap info icon
4. Copy webhook token

## Environment Variables

- `KWEENKL_DEVICE_TOKEN` - Your device token for channel management (optional but recommended)
- `KWEENKL_API_URL` - API base URL (default: https://api.kweenkl.com)
- `KWEENKL_DEBUG` - Enable debug logging (set to 'true')

## 🛠️ Tools Available

### 📨 Core Tool

#### `kweenkl`
**Send a push notification to a channel**

The `kweenkl` tool accepts the following parameters:

- `webhook_token` (required): Your channel's webhook token
- `message` (required): The notification message (max 500 chars recommended)
- `title` (optional): Brief title for the notification (max 50 chars recommended)
- `priority` (optional): Priority level - "low", "normal" (default), or "high"
- `payload` (optional): Custom JSON object for additional metadata

### 🔧 Channel Management Tools
*(requires KWEENKL_DEVICE_TOKEN)*

#### `kweenkl_list_channels`
**📋 List all your notification channels with their webhook URLs**

**No parameters required**

**Example usage:**
```
User: "Show me all my kweenkl channels"
AI: [Uses kweenkl_list_channels tool]
Response:
📢 Your kweenkl channels (3):

1. **Production Alerts**
   ID: abc-123
   Webhook: https://api.kweenkl.com/webhook/xyz-789
   Notifications: 42

2. **Daily Reports**
   ID: def-456
   Webhook: https://api.kweenkl.com/webhook/uvw-789
   Notifications: 7
```

#### `kweenkl_create_channel`
**➕ Create a new notification channel**

**Parameters:**
- `name` (required): Channel name
- `description` (optional): Channel description
- `color` (optional): Hex color code (e.g., "#FF0000")
- `icon` (optional): Icon name

**Example usage:**
```
User: "Create a channel called 'Server Alerts' with a red color"
AI: [Uses kweenkl_create_channel tool]
Response:
✅ Channel created!

**Server Alerts**
ID: new-channel-id
Webhook URL: https://api.kweenkl.com/webhook/new-token

You can now send notifications to this channel!
```

#### `kweenkl_update_channel`
**✏️ Update an existing channel's properties**

**Parameters:**
- `channel_id` (required): Channel ID to update
- `name` (optional): New name
- `description` (optional): New description
- `color` (optional): New hex color
- `icon` (optional): New icon name

**Example usage:**
```
User: "Rename the 'Test' channel to 'Production'"
AI: [Uses kweenkl_list_channels to find the channel ID, then kweenkl_update_channel]
Response:
✅ Channel updated!

**Production**
ID: abc-123
Webhook: https://api.kweenkl.com/webhook/xyz-789
```

#### `kweenkl_delete_channel`
**🗑️ Delete a notification channel permanently**

**Parameters:**
- `channel_id` (required): Channel ID to delete

**Example usage:**
```
User: "Delete the 'Old Test' channel"
AI: [Uses kweenkl_list_channels to find the channel ID, then kweenkl_delete_channel]
Response:
✅ Channel "Old Test" deleted successfully.
```

## Testing

Run the test suite:

```bash
npm test
```

Or test manually with the MCP Inspector:

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector node /path/to/kweenkl-mcp-server/index.js
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server not appearing in AI | Check JSON syntax in config file, verify file path, restart AI client |
| 404 errors | Verify webhook token in kweenkl app |
| No notifications received | Ensure you're subscribed to the channel in the iOS app |
| Network errors | Check firewall/proxy settings, ensure api.kweenkl.com is accessible |

## 📋 Requirements

- Node.js 18+
- Valid kweenkl webhook token
- Internet connection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

<div align="center">

Made with ❤️ by the kweenkl team

[Website](https://kweenkl.com) • [GitHub](https://github.com/antoinedelorme/kweenkl-mcp) • [Issues](https://github.com/antoinedelorme/kweenkl-mcp/issues)

</div>

<!-- Badge References -->
[lobehub-shield]: https://img.shields.io/badge/LobeHub-MCP_Server-blue?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDMyQzI0LjgzNjYgMzIgMzIgMjQuODM2NiAzMiAxNkMzMiA3LjE2MzQ0IDI0LjgzNjYgMCAxNiAwQzcuMTYzNDQgMCA0LjQ5IDcuMTYzNDQgNC40OSAxNkM0LjQ5IDI0LjgzNjYgNy4xNjM0NCAzMiAxNiAzMloiIGZpbGw9IiMwMDAwMDAiLz4KPC9zdmc+Cg==
[lobehub-url]: https://lobehub.com/mcp/antoinedelorme-kweenkl-mcp
[license-shield]: https://img.shields.io/badge/license-MIT-green
[license-url]: https://github.com/antoinedelorme/kweenkl-mcp/blob/main/LICENSE
[node-shield]: https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen
[node-url]: https://nodejs.org/
