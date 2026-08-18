[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/antoinedelorme-kweenkl-mcp-badge.png)](https://mseep.ai/app/antoinedelorme-kweenkl-mcp)

# kweenkl MCP Server (Deprecated)

> **This local MCP server is deprecated.** Use the hosted remote MCP server instead — no installation required.

## Use the Remote MCP Server

**Endpoint:** `https://api.kweenkl.com/mcp`

### Setup

1. Download the [kweenkl iOS app](https://testflight.apple.com/join/achwt8Jt)
2. Go to **Settings** in the app and copy your **Device Token**
3. Add the MCP server to your AI client:

**Claude Code:**
```bash
claude mcp add kweenkl https://api.kweenkl.com/mcp --transport http --scope user --header "X-Kweenkl-Device-Token: YOUR_DEVICE_TOKEN"
```

**ChatGPT:** Add `https://api.kweenkl.com/mcp` in Settings > Apps & Connectors. Authentication is handled via OAuth — you'll be prompted to enter your device token during setup.

**Any MCP client:** Point to `https://api.kweenkl.com/mcp` with the `X-Kweenkl-Device-Token` header.

### Full Documentation

See [kweenkl.com/skill.md](https://kweenkl.com/skill.md) for the complete API reference.

### Links

- [Website](https://kweenkl.com)
- [iOS App (TestFlight)](https://testflight.apple.com/join/achwt8Jt)

## License

MIT
