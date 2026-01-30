# MailPoet Integration

**Status:** Deferred to Phase 7 (June 2026, closer to BB28 season)
**Decision Date:** January 23, 2026

## Decision

Keeping MailPoet for now. It handles the use case well and there's no real lock-in - email lists are fully portable via CSV export.

Current usage is simple:
- Collect email addresses
- Auto-send when new post published

## Future Plan (Phase 7)

When ready to implement:

### Subscription Preferences
Create multiple lists for user preferences:
- "Instant Notifications" - immediate on publish
- "Daily Digest" - batched daily
- "Weekly Roundup" - batched weekly

Each list gets its own Post Notification email with matching frequency.

### Template Design
- Current templates need redesign
- Use MailPoet's drag-and-drop editor
- Configure: title, excerpt, featured image, etc.
- Design once, auto-populates with new posts

### API Integration
MailPoet exposes REST at `/wp-json/mailpoet/v1/`:
- `AddSubscriber` - create subscriber with list IDs
- `SubscribeToLists` - add to lists
- `UnsubscribeFromLists` - remove from lists

Wire into Next.js Settings page for preference management.

### Setup Steps
1. Create 3 lists (instant/daily/weekly)
2. Create 3 Post Notification emails with matching frequencies
3. Design template, duplicate for each list
4. Add list preference checkboxes to Settings/registration
5. Configure MailPoet sending service for deliverability

## Resources

- [Post Notification Setup](https://kb.mailpoet.com/article/347-create-a-post-notification-email)
- [Subscriber/List Management](https://kb.mailpoet.com/category/121-subscribers-and-lists)
- [API Docs](https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/AddSubscriber.md)

## Why Not Build Custom?

Considered but decided against:
- Cloudways likely throttles bulk email - would need SendGrid/SES anyway
- Deliverability is complex (SPF, DKIM, bounce handling)
- Would essentially rebuild what MailPoet already does
- MailPoet is already in the WordPress stack
