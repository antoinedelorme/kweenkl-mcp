#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const KWEENKL_API_URL = process.env.KWEENKL_API_URL || "https://api.kweenkl.com";
const KWEENKL_DEVICE_TOKEN = process.env.KWEENKL_DEVICE_TOKEN || null;
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

// Define all kweenkl tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog('Tool list requested');

  const tools = [
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
    }
  ];

  // Add channel management tools if device token is configured
  if (KWEENKL_DEVICE_TOKEN) {
    tools.push(
      {
        name: "kweenkl_list_channels",
        description: "List all your kweenkl notification channels with their webhook URLs. Use this to see what channels you have and get their webhook tokens.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "kweenkl_create_channel",
        description: "Create a new kweenkl notification channel. Returns the channel details including the webhook URL that you can use to send notifications.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name for the new channel (e.g., 'Production Alerts', 'Daily Reports')",
            },
            description: {
              type: "string",
              description: "Optional description of what this channel is for",
            },
            color: {
              type: "string",
              description: "Optional hex color code for the channel (e.g., '#FF0000' for red). Default: #007AFF",
            },
            icon: {
              type: "string",
              description: "Optional icon name for the channel. Default: 'bell'",
            }
          },
          required: ["name"],
        },
      },
      {
        name: "kweenkl_update_channel",
        description: "Update a kweenkl channel's name, description, color, or icon. Use this to rename or modify existing channels.",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: {
              type: "string",
              description: "The ID of the channel to update (get this from kweenkl_list_channels)",
            },
            name: {
              type: "string",
              description: "New name for the channel",
            },
            description: {
              type: "string",
              description: "New description for the channel",
            },
            color: {
              type: "string",
              description: "New hex color code (e.g., '#FF0000')",
            },
            icon: {
              type: "string",
              description: "New icon name",
            }
          },
          required: ["channel_id"],
        },
      },
      {
        name: "kweenkl_delete_channel",
        description: "Delete a kweenkl notification channel. This permanently removes the channel and all its notifications. Use with caution!",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: {
              type: "string",
              description: "The ID of the channel to delete (get this from kweenkl_list_channels)",
            }
          },
          required: ["channel_id"],
        },
      }
    );
  }

  return { tools };
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

// Channel management functions
async function listChannels() {
  debugLog('Listing channels');

  if (!KWEENKL_DEVICE_TOKEN) {
    return {
      content: [{
        type: "text",
        text: "❌ Device token not configured. Set KWEENKL_DEVICE_TOKEN environment variable to use channel management.",
      }],
      isError: true,
    };
  }

  try {
    const response = await fetch(`${KWEENKL_API_URL}/api/v1/channels`, {
      headers: {
        "Authorization": `Bearer ${KWEENKL_DEVICE_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{
          type: "text",
          text: `❌ Failed to list channels: ${response.status} ${errorText}`,
        }],
        isError: true,
      };
    }

    const data = await response.json();
    const channels = data.channels || [];

    if (channels.length === 0) {
      return {
        content: [{
          type: "text",
          text: "📭 No channels found. Create your first channel with kweenkl_create_channel!",
        }],
      };
    }

    let output = `📢 Your kweenkl channels (${channels.length}):\n\n`;
    channels.forEach((ch, i) => {
      output += `${i + 1}. **${ch.name}**\n`;
      output += `   ID: ${ch.id}\n`;
      output += `   Webhook: ${ch.webhook_url}\n`;
      output += `   Notifications: ${ch.notification_count}\n`;
      if (ch.description) output += `   Description: ${ch.description}\n`;
      output += `\n`;
    });

    return {
      content: [{
        type: "text",
        text: output,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to list channels: ${error.message}`,
      }],
      isError: true,
    };
  }
}

async function createChannel({ name, description, color, icon }) {
  debugLog('Creating channel:', name);

  if (!KWEENKL_DEVICE_TOKEN) {
    return {
      content: [{
        type: "text",
        text: "❌ Device token not configured. Set KWEENKL_DEVICE_TOKEN environment variable.",
      }],
      isError: true,
    };
  }

  try {
    const body = { name };
    if (description) body.description = description;
    if (color) body.color = color;
    if (icon) body.icon = icon;

    const response = await fetch(`${KWEENKL_API_URL}/api/v1/channels`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KWEENKL_DEVICE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{
          type: "text",
          text: `❌ Failed to create channel: ${response.status} ${errorText}`,
        }],
        isError: true,
      };
    }

    const data = await response.json();
    const channel = data.channel;

    return {
      content: [{
        type: "text",
        text: `✅ Channel created!\n\n**${channel.name}**\nID: ${channel.id}\nWebhook URL: ${data.webhook_url}\n\nYou can now send notifications to this channel!`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to create channel: ${error.message}`,
      }],
      isError: true,
    };
  }
}

async function updateChannel({ channel_id, name, description, color, icon }) {
  debugLog('Updating channel:', channel_id);

  if (!KWEENKL_DEVICE_TOKEN) {
    return {
      content: [{
        type: "text",
        text: "❌ Device token not configured. Set KWEENKL_DEVICE_TOKEN environment variable.",
      }],
      isError: true,
    };
  }

  try {
    const body = {};
    if (name !== undefined) body.name = name;
    if (description !== undefined) body.description = description;
    if (color !== undefined) body.color = color;
    if (icon !== undefined) body.icon = icon;

    if (Object.keys(body).length === 0) {
      return {
        content: [{
          type: "text",
          text: "❌ No fields to update. Provide at least one of: name, description, color, icon",
        }],
        isError: true,
      };
    }

    const response = await fetch(`${KWEENKL_API_URL}/api/v1/channels/${channel_id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${KWEENKL_DEVICE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{
          type: "text",
          text: `❌ Failed to update channel: ${response.status} ${errorText}`,
        }],
        isError: true,
      };
    }

    const data = await response.json();
    const channel = data.channel;

    return {
      content: [{
        type: "text",
        text: `✅ Channel updated!\n\n**${channel.name}**\nID: ${channel.id}\nWebhook: ${channel.webhook_url}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to update channel: ${error.message}`,
      }],
      isError: true,
    };
  }
}

async function deleteChannel({ channel_id }) {
  debugLog('Deleting channel:', channel_id);

  if (!KWEENKL_DEVICE_TOKEN) {
    return {
      content: [{
        type: "text",
        text: "❌ Device token not configured. Set KWEENKL_DEVICE_TOKEN environment variable.",
      }],
      isError: true,
    };
  }

  try {
    const response = await fetch(`${KWEENKL_API_URL}/api/v1/channels/${channel_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${KWEENKL_DEVICE_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{
          type: "text",
          text: `❌ Failed to delete channel: ${response.status} ${errorText}`,
        }],
        isError: true,
      };
    }

    const data = await response.json();
    return {
      content: [{
        type: "text",
        text: `✅ Channel "${data.deleted_channel?.name || 'unknown'}" deleted successfully.`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to delete channel: ${error.message}`,
      }],
      isError: true,
    };
  }
}

// Handle kweenkl tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  debugLog('Tool call requested:', request.params.name);

  const toolName = request.params.name;
  const args = request.params.arguments;

  // Route to appropriate handler
  switch (toolName) {
    case "kweenkl":
      const { webhook_token, message, title, priority, payload } = args;

      // Validate required parameters
      if (!webhook_token || !message) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: webhook_token and message are required parameters.",
          }],
          isError: true,
        };
      }

      // Validate priority if provided
      if (priority && !['low', 'normal', 'high'].includes(priority)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: priority must be one of: low, normal, high",
          }],
          isError: true,
        };
      }

      return await executeKweenkl({ webhook_token, message, title, priority, payload });

    case "kweenkl_list_channels":
      return await listChannels();

    case "kweenkl_create_channel":
      return await createChannel(args);

    case "kweenkl_update_channel":
      return await updateChannel(args);

    case "kweenkl_delete_channel":
      return await deleteChannel(args);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
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

export { executeKweenkl };
