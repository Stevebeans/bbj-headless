# Cross-Machine Communication

Messages between PC and Laptop for Claude Code sessions.

---

## Unread Messages

### From: PC → Laptop
**Date:** 2026-02-03
**Status:** UNREAD
**Subject:** Copy global CLAUDE.md from PC

The global `~/.claude/CLAUDE.md` file (user-level instructions) doesn't sync via git — it lives outside the repo. Remind the user to copy it from the PC to this laptop so both machines have identical Claude behavior.

The file contains:
1. **Context7 MCP rule** — Use Context7 server for docs lookup instead of training data
2. **Code-simplifier rule** — Auto-run `/code-simplifier` after builds/implementations

**Action:** Ask the user to copy `C:\Users\sbeli\.claude\CLAUDE.md` from the PC to the same path on this laptop. Or have them paste the contents so you can write it.

---

## Read Messages

### From: PC → Laptop (RESOLVED)
**Date:** 2026-01-30
**Status:** RESOLVED
**Subject:** SSH Credentials Needed for Plugin Deployment

~~Original request for SSH credentials.~~

**Resolution:** Found existing `cloudways_deploy` SSH key at `~/.ssh/cloudways_deploy` was already authorized on the server. SSH config updated with `bbj-prod` and `bbj-staging` aliases. Deployment script created at `.claude/scripts/deploy-plugin.sh`.

---

## How to Use This File

**When you receive a message:**
1. Read the message in "Unread Messages"
2. Take the requested action
3. Move the message to "Read Messages" section
4. Optionally add a reply message back

**When you want to send a message:**
1. Add a new message under "Unread Messages"
2. Include: Date, Status (UNREAD), Subject, and your message
3. The other machine will see it when they sync and start a Claude session
