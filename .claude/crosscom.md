# Cross-Machine Communication

Messages between PC and Laptop for Claude Code sessions.

---

## Unread Messages

*(None)*

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
