# Auth & Permissions System Design

**Date:** 2026-02-28
**Status:** Approved
**Scope:** Fix admin badge bug, build global permission system, add role member info icons

## Problem Statement

1. Admin badge (shield icon) in Header doesn't appear after login until page refresh
2. Permission checks only exist in admin dashboard layout — not globally available
3. No API-level permission enforcement on routes (UI-only gating)
4. Adding new permissions requires changes in multiple places
5. No way to see which users belong to each role from the settings page

## Section 1: Admin Badge Bug Fix

### Root Cause

Google OAuth login paths (`loginWithGoogle`, `linkGoogleAccount`, `createFromGoogle` in `AuthContext.jsx`) set user state from the API response. But the API response only returns `{ id, email, username, display_name, avatar }` — **no roles**.

Email/password login works because it calls `fetchCurrentUser()` after login, which hits `/auth/me` and returns `user_roles`. The Google paths skip that step.

### Fix

**Backend** (`AuthRoutes.php`): Add `'roles' => (array) $user->roles` to all user response objects (Google login, link-google, create-from-google).

**Frontend** (`AuthContext.jsx`): In `loginWithGoogle`, `linkGoogleAccount`, `createFromGoogle` — map `data.user.roles` to `user_roles` when calling `setUserAndCache`.

## Section 2: Global Permission Helper (Backend)

### Current State

`checkFeatureAccess()` is a private method on `AdminRoutes`. Only usable within that class.

### Design

New file: `src/Permissions/PermissionChecker.php`

```php
class PermissionChecker
{
    public const DEFAULT_PERMISSIONS = [...]; // Moved from AdminRoutes

    public static function userCan(string $feature, ?int $userId = null): bool
    public static function getUserFeatures(?int $userId = null): array
    public static function getPermissionConfig(): array
}
```

- Static utility, no instantiation needed
- Reads from `bbj_admin_permissions` option, falls back to DEFAULT_PERMISSIONS
- `AdminRoutes` refactored to delegate to `PermissionChecker`
- DEFAULT_PERMISSIONS moved to PermissionChecker (AdminRoutes references it)

## Section 3: API Route Protection

Existing routes already have correct permission callbacks:
- Comment routes → `comment_moderation`
- Settings routes → `admin_settings`
- Announcement routes → `announcements`
- Dashboard/my-permissions → any feature (correct for overview)

Future routes (feed updates, players, seasons, etc.) will use `PermissionChecker::userCan()` in their permission callbacks when built.

## Section 4: Frontend `usePermissions` Hook

### Current State

Permissions fetched and stored in `AdminLayout` component state. Only available within `/admin` pages.

### Design

New file: `src/hooks/usePermissions.js`

```javascript
export function usePermissions() {
  // Returns: { permissions, loading, hasPermission(feature) }
}
```

- Fetches via `getMyPermissions()` once per session, caches in state
- Only fetches when user is authenticated
- `AdminLayout` refactored to use this hook
- Available for any component (admin or public pages)

## Section 5: Info Icon (Role Members)

### New API Endpoint

`GET /bbjd/v1/admin/role-members?role=updater`

Response: `[{ id, display_name, avatar }]`

Permission: `admin_settings` only.

### Frontend

Info icon next to each role column header in Feature Permissions table. Click shows popover with user list (avatar + name). Fetches on click, no pre-loading.

## Section 6: Expandability

Adding a new feature permission requires **one change**:

1. Add entry to `PermissionChecker::DEFAULT_PERMISSIONS`
2. Settings UI auto-renders new row
3. `usePermissions` hook auto-includes it
4. API auto-checks it via `PermissionChecker::userCan()`

If a new admin tab accompanies it, add one entry to the `TABS` array in `admin/layout.jsx`.

## Files to Create

| File | Purpose |
|------|---------|
| `src/Permissions/PermissionChecker.php` (WP plugin) | Global permission utility |
| `src/hooks/usePermissions.js` (Next.js) | Frontend permission hook |

## Files to Modify

| File | Changes |
|------|---------|
| `AuthRoutes.php` | Add roles to Google OAuth user responses |
| `AuthContext.jsx` | Map roles in Google login handlers |
| `AdminRoutes.php` | Delegate to PermissionChecker, remove private methods |
| `admin/layout.jsx` | Use usePermissions hook |
| `admin/settings/page.jsx` | Add info icon + popover for role members |
| `lib/api/admin.js` | Add getRoleMembers() function |
