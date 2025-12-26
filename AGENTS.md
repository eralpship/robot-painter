# Agent Instructions

## MCP Server Preferences

### Browser Automation

**ALWAYS use Chrome DevTools MCP server instead of Playwright MCP server.**

When you need to interact with web pages, inspect network requests, check cache headers, or perform any browser automation tasks:

- ✅ **Use:** `mcp__chrome-devtools__*` tools
- ❌ **Don't use:** `mcp__playwright__*` tools

### Reasons

1. **Chrome DevTools MCP server** provides more detailed network inspection capabilities
2. Better access to response headers and caching information
3. More reliable for debugging and inspection tasks
4. Consistent with project testing preferences

### Examples

**Good:**
```
- mcp__chrome-devtools__navigate_page
- mcp__chrome-devtools__list_network_requests
- mcp__chrome-devtools__get_network_request
- mcp__chrome-devtools__take_snapshot
```

**Avoid:**
```
- mcp__playwright__browser_navigate
- mcp__playwright__browser_network_requests
- mcp__playwright__browser_snapshot
```

## General Guidelines

- Always prefer Chrome DevTools MCP server for web inspection and debugging
- Use the most specific tool available for the task
- Check response headers and network details when investigating performance issues
