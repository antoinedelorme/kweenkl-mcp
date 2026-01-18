# Contributing to kweenkl-mcp

Thank you for your interest in contributing to kweenkl-mcp!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/kweenkl-mcp.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development

### Running locally

```bash
npm start
```

### Testing

```bash
npm test
```

### Testing with MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector node index.js
```

## Pull Request Process

1. Ensure your code follows the existing style
2. Update documentation if needed
3. Add tests for new features
4. Make sure all tests pass
5. Submit a pull request with a clear description

## Code Style

- Use ES modules (import/export)
- Use async/await for asynchronous code
- Add JSDoc comments for functions
- Keep functions small and focused

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new notification priority option`
- `fix: handle network timeout gracefully`
- `docs: update README with new examples`
- `test: add tests for channel management`

## Questions?

Open an issue or reach out at contact@kweenkl.com
