# Agent Instructions

- Use 'bd' for task tracking
- Before implementing or analysing anything you must first create tasks with 'bd'.
- Never start working on anything without creating a 'bd' task and it's subtasks if applies.
- Keep track of what to do and what has been done using 'bd'
- If context is running low, first write all todos to 'bd' as tasks, and then compact the conversation.

## MCP Server Preferences

### Browser Automation
check http://localhost:3000 and http://localhost:3000 to check current development state.
production is at https://robot.cicex.cloud if you ever need to compare with earlier state
you don't need to start the development server yourself, i will be running it for you. if localhost:3000 doesn't respond, tell me so i can start it for you.

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
## General Guidelines

- Always prefer Chrome DevTools MCP server for web inspection and debugging
- Use the most specific tool available for the task
- Check response headers and network details when investigating performance issues

**Use:**
```
- mcp__chrome-devtools__get_network_request
- mcp__chrome-devtools__take_snapshot
- mcp__chrome-devtools__navigate_page
- mcp__chrome-devtools__list_network_requests
```


**Avoid:**
```
- mcp__playwright__browser_navigate
- mcp__playwright__browser_network_requests
- mcp__playwright__browser_snapshot
```

## Landing the Plane (Session Completion)

- `npm run lint` should not report warnings or errors
- `npm run format` should not report warnings or errors
- `npm run check` should not report warnings or errors

**CRITICAL RULES:**
- Work is NOT complete until `git push` I verify that the fix is working
- However don't ever git push yourself, let me do the push manually
- NEVER stop before work is ready for pushing - that leaves work stranded locally

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
