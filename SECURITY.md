# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in kweenkl-mcp, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email us at: security@kweenkl.com
3. Include details about the vulnerability and steps to reproduce

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

When using kweenkl-mcp:

- **Keep your device token private** - Never commit it to version control
- **Use environment variables** - Store sensitive tokens in env vars, not config files
- **Keep dependencies updated** - Run `npm update` regularly
- **Use the latest version** - Always use the most recent release

## Token Security

- Device tokens should be treated like passwords
- Webhook tokens are channel-specific and can be rotated in the iOS app
- Never share tokens in public channels or repositories
