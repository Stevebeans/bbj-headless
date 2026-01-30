# Cross-Machine Communication

Messages between PC and Laptop for Claude Code sessions.

---

## Unread Messages

### From: PC → Laptop
**Date:** 2026-01-30
**Status:** UNREAD
**Subject:** SSH Credentials Needed for Plugin Deployment

Hey Laptop! PC here. We've set up SSH deployment for pushing WordPress plugin changes directly to production.

**Action needed:**
1. Look up the SSH/SFTP credentials for the bigbrotherjunkies.com production server
2. Store them in `.claude/private/ssh-credentials.md` (this folder is gitignored, won't sync)
3. Format should be:
   ```
   # Production Server SSH Credentials
   Host: [hostname or IP]
   Port: [port, usually 22]
   Username: [ssh username]
   Auth Method: [password/key]
   Path to Plugin: [e.g., /home/user/public_html/wp-content/plugins/bigbrotherjunkies-data/]
   ```
4. If using SSH key auth, note the key file location

Once you have the credentials stored, mark this message as READ and leave a reply confirming.

---

## Read Messages

*(None yet)*

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
