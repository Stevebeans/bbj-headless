## Billing System

**Status:** Complete (Feb 2, 2026) - Pending live testing

---

### Implementation Summary

The premium billing system supports both Stripe and PayPal for user memberships. When users purchase a subscription, they are assigned the appropriate WordPress role which grants them supporter benefits.

### Roles

| Role | Plan | Price | Benefits |
|------|------|-------|----------|
| `supporter` | Monthly | $6.95/mo | Ad-free, badge, quick reply, extended stats |
| `supporter` | Season Pass | $35/yr | Same as monthly (annual discount) |
| `lifetime` | Lifetime | $99 one-time | Same as supporter, forever |

Note: `administrator` and `editor` roles also get supporter benefits automatically.

### Payment Providers

**Stripe:**
- Checkout redirect flow (no SDK, handles PCI compliance)
- Customer Portal for subscription management
- Webhooks handle role assignment automatically

**PayPal:**
- SDK loaded dynamically when needed
- Supports both subscriptions and one-time payments (lifetime)
- Direct cancel through Settings page

**Apple Pay:** Automatically available through Stripe Checkout on supported devices.

### Perks (Implemented)

- [x] Ad-free experience (based on role check)
- [x] Special badge in comments (based on role)
- [x] Nice banner in settings area (Premium tab)
- [x] Ability to quick reply on feed updates (isSupporter check)
- [x] Ability to view extended stats (premium lock in stats tab)
- [x] "Thank you for your support!" message in header
- [x] Star indicator next to supporter link

### Cancellation

- **Stripe users:** Click "Manage Subscription" → Opens Stripe Customer Portal → Cancel there
- **PayPal users:** Click "Cancel Subscription" → Confirmation modal → Cancels immediately
- Both flows are designed to be user-friendly and transparent

### Files Created

**Frontend (Next.js):**
- `src/lib/api/billing.js` - API client functions
- `src/app/become-supporter/page.jsx` - Checkout page with plan selection
- `src/app/checkout/success/page.jsx` - Success page (captures PayPal)
- `src/app/checkout/cancel/page.jsx` - Cancelled payment page
- `src/app/settings/page.jsx` - PremiumTab with subscription management

**Backend (WordPress Plugin):**
- `wp-plugin/.../Admin/Pages/ApiSettingsPage.php` - Admin page for API credentials
- `wp-plugin/.../Billing/StripeService.php` - Stripe integration (updated)
- `wp-plugin/.../Billing/PayPalService.php` - PayPal integration (updated)
- `wp-plugin/.../Api/BillingRoutes.php` - REST API endpoints (already existed)

### Configuration

API credentials are stored in WordPress options via the API Settings admin page:
- WP Admin → BBJ Data → API Settings
- Test mode vs. Live mode toggle for both Stripe and PayPal
- Webhook secrets configured there as well

### Testing Checklist (For Live Launch)

- [ ] Add live Stripe credentials in API Settings
- [ ] Add live PayPal credentials in API Settings
- [ ] Configure Stripe webhook: `https://bigbrotherjunkies.com/wp-json/bbjd/v1/billing/webhook/stripe`
- [ ] Configure PayPal webhook (if using PayPal subscriptions)
- [ ] Test Monthly checkout (Stripe)
- [ ] Test Season Pass checkout (Stripe)
- [ ] Test Lifetime checkout (PayPal)
- [ ] Verify role assignment after successful payment
- [ ] Test subscription cancellation
- [ ] Test Stripe Customer Portal access
- [ ] Verify "Thank you" message shows for supporters

### Future Enhancements

- Invoice history display in Settings
- Upgrade/downgrade between plans
- Payment method management
- Gift subscriptions (see Phase 4.3 in roadmap)
- Premium tiers (Basic vs VIP)
