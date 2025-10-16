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

export { executeKweenkl };
