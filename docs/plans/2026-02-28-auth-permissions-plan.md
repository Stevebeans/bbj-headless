# Auth & Permissions System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the admin badge hydration bug, create a global permission system (backend + frontend), add role member info icons to the settings page.

**Architecture:** Backend gets a static `PermissionChecker` utility that centralizes all permission logic. Frontend gets a `usePermissions` hook that makes permission checks available anywhere. Auth responses are fixed to include roles. Admin settings page gets info icons showing role members.

**Tech Stack:** PHP 8.1 (WordPress plugin), Next.js 15 (React), Tailwind CSS

**Paths:**
- WP Plugin: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\`
- Next.js App: `C:\xampp\htdocs\bbj-app\`

---

### Task 1: Fix Admin Badge Bug — Backend (Add roles to auth responses)

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AuthRoutes.php`

**Step 1: Add `roles` to Google OAuth login response**

In `AuthRoutes.php` around line 305-311, the `handleGoogleAuth` response is missing roles. Add `'roles'` to the user array:

```php
// Line ~305-311 — Google OAuth login response
'user' => [
    'id' => $user->ID,
    'email' => $user->user_email,
    'username' => $user->user_login,
    'display_name' => $user->display_name,
    'avatar' => AvatarUploader::getAvatarUrl($user->ID),
    'roles' => array_values((array) $user->roles),
],
```

**Step 2: Add `roles` to link-google response**

In `AuthRoutes.php` around line 825-831 (`handleLinkGoogle` response), same change:

```php
// Line ~825-831 — Link Google account response
'user' => [
    'id' => $user->ID,
    'email' => $user->user_email,
    'username' => $user->user_login,
    'display_name' => $user->display_name,
    'avatar' => AvatarUploader::getAvatarUrl($user->ID),
    'roles' => array_values((array) $user->roles),
],
```

**Step 3: Add `roles` to create-from-google response**

In `AuthRoutes.php` around line 903-909 (`handleCreateFromGoogle` response):

```php
// Line ~903-909 — Create from Google response
'user' => [
    'id' => $user->ID,
    'email' => $user->user_email,
    'username' => $user->user_login,
    'display_name' => $user->display_name,
    'avatar' => AvatarUploader::getAvatarUrl($user->ID),
    'roles' => array_values((array) $user->roles),
],
```

Note: `array_values()` ensures sequential array (avoids PHP object serialization when keys are non-sequential).

**Step 4: Verify locally**

Test by calling the Google OAuth endpoint and confirming `roles` appears in the response JSON.

---

### Task 2: Fix Admin Badge Bug — Frontend (Map roles in auth context)

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\context\AuthContext.jsx`

**Step 1: Fix `loginWithGoogle` to include roles**

In `AuthContext.jsx` lines 254-261, the `setUserAndCache` call doesn't map roles. Change to:

```javascript
// In loginWithGoogle success handler (around line 254-261)
setUserAndCache({
  ...data.user,
  token: data.token,
  user_display_name: data.user.display_name,
  user_email: data.user.email,
  user_roles: normalizeRoles(data.user.roles),
  avatar: data.user.avatar,
});
```

**Step 2: Fix `linkGoogleAccount` to include roles**

In `AuthContext.jsx` lines 294-300:

```javascript
// In linkGoogleAccount success handler (around line 294-300)
setUserAndCache({
  ...data.user,
  token: data.token,
  user_display_name: data.user.display_name,
  user_email: data.user.email,
  user_roles: normalizeRoles(data.user.roles),
  avatar: data.user.avatar,
});
```

**Step 3: Fix `createFromGoogle` to include roles**

In `AuthContext.jsx` lines 335-340:

```javascript
// In createFromGoogle success handler (around line 335-340)
setUserAndCache({
  ...data.user,
  token: data.token,
  user_display_name: data.user.display_name,
  user_email: data.user.email,
  user_roles: normalizeRoles(data.user.roles),
  avatar: data.user.avatar,
});
```

**Step 4: Test the fix**

1. Log out
2. Log in via Google OAuth
3. Verify the admin badge (shield icon) appears immediately without page refresh
4. Verify avatar and notification bell still render correctly

**Step 5: Commit**

```bash
git add -A && git commit -m "fix: admin badge not showing after Google OAuth login

Add roles to all Google OAuth API responses (backend) and map them
in AuthContext setUserAndCache calls (frontend). Previously roles
were missing from Google login responses, causing isAdmin() to
return false until page refresh."
```

---

### Task 3: Create PermissionChecker (Backend Global Helper)

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Permissions\PermissionChecker.php`

**Step 1: Create the PermissionChecker class**

```php
<?php

namespace BigBrotherJunkies\Data\Permissions;

/**
 * Global permission checker for BBJ feature permissions.
 *
 * Usage:
 *   PermissionChecker::userCan('feed_updates')           // current user
 *   PermissionChecker::userCan('feed_updates', 123)      // specific user
 *   PermissionChecker::getUserFeatures()                  // all features for current user
 *   PermissionChecker::getPermissionConfig()              // full config with labels/descriptions
 */
class PermissionChecker
{
    /**
     * Default permissions — the single source of truth.
     * Adding a new entry here auto-renders it in the admin settings UI.
     */
    public const DEFAULT_PERMISSIONS = [
        'comment_moderation' => [
            'label' => 'Moderate Comments',
            'description' => 'View reports, approve/delete comments, manage blacklist',
            'roles' => ['administrator', 'editor'],
        ],
        'feed_updates' => [
            'label' => 'Feed Updater',
            'description' => 'Post and edit live feed updates',
            'roles' => ['administrator', 'updater'],
        ],
        'player_management' => [
            'label' => 'Manage Players',
            'description' => 'Add/edit player profiles',
            'roles' => ['administrator', 'editor'],
        ],
        'season_management' => [
            'label' => 'Manage Seasons',
            'description' => 'Add/edit seasons, set current season',
            'roles' => ['administrator'],
        ],
        'admin_settings' => [
            'label' => 'Admin Settings',
            'description' => 'Configure permissions and notifications',
            'roles' => ['administrator'],
        ],
        'analytics_dashboard' => [
            'label' => 'View Analytics',
            'description' => 'Access site analytics and traffic data',
            'roles' => ['administrator'],
        ],
        'announcements' => [
            'label' => 'Announcements',
            'description' => 'Send site-wide announcements to all users',
            'roles' => ['administrator'],
        ],
        'bug_reports' => [
            'label' => 'Bug Reports',
            'description' => 'View and manage user-submitted bug reports',
            'roles' => ['administrator'],
        ],
        'ad_management' => [
            'label' => 'Ad Management',
            'description' => 'Manage ad slots, placements, and ad-free users',
            'roles' => ['administrator'],
        ],
        'user_management' => [
            'label' => 'User Management',
            'description' => 'View and manage users, roles, and accounts',
            'roles' => ['administrator'],
        ],
    ];

    /**
     * Check if a user has access to a specific feature.
     *
     * @param string $feature Permission key (e.g. 'feed_updates')
     * @param int|null $userId User ID, or null for current user
     * @return bool
     */
    public static function userCan(string $feature, ?int $userId = null): bool
    {
        if ($userId) {
            $user = get_user_by('ID', $userId);
        } else {
            if (!is_user_logged_in()) {
                return false;
            }
            $user = wp_get_current_user();
        }

        if (!$user || !$user->exists()) {
            return false;
        }

        $permissions = self::getPermissionConfig();

        if (!isset($permissions[$feature])) {
            return false;
        }

        return !empty(array_intersect((array) $user->roles, $permissions[$feature]['roles']));
    }

    /**
     * Check if a user has access to ANY feature (i.e. can see admin dashboard).
     *
     * @param int|null $userId User ID, or null for current user
     * @return bool
     */
    public static function userCanAny(?int $userId = null): bool
    {
        if ($userId) {
            $user = get_user_by('ID', $userId);
        } else {
            if (!is_user_logged_in()) {
                return false;
            }
            $user = wp_get_current_user();
        }

        if (!$user || !$user->exists()) {
            return false;
        }

        $permissions = self::getPermissionConfig();

        foreach ($permissions as $permission) {
            if (!empty(array_intersect((array) $user->roles, $permission['roles']))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all features the user has access to (keyed by feature name).
     *
     * @param int|null $userId User ID, or null for current user
     * @return array ['feature_key' => ['label' => '...', 'description' => '...'], ...]
     */
    public static function getUserFeatures(?int $userId = null): array
    {
        if ($userId) {
            $user = get_user_by('ID', $userId);
        } else {
            if (!is_user_logged_in()) {
                return [];
            }
            $user = wp_get_current_user();
        }

        if (!$user || !$user->exists()) {
            return [];
        }

        $permissions = self::getPermissionConfig();
        $features = [];

        foreach ($permissions as $key => $permission) {
            if (!empty(array_intersect((array) $user->roles, $permission['roles']))) {
                $features[$key] = [
                    'label' => $permission['label'],
                    'description' => $permission['description'],
                ];
            }
        }

        return $features;
    }

    /**
     * Get full permission config (saved settings merged with defaults).
     * New permissions in DEFAULT_PERMISSIONS are auto-added.
     *
     * @return array
     */
    public static function getPermissionConfig(): array
    {
        $saved = get_option('bbj_admin_permissions', []);

        // Merge: saved settings take precedence, but new defaults are auto-added
        $merged = self::DEFAULT_PERMISSIONS;
        foreach ($saved as $key => $config) {
            if (isset($merged[$key])) {
                $merged[$key] = array_merge($merged[$key], $config);
            }
        }

        return $merged;
    }
}
```

**Step 2: Verify the file loads**

Check that the namespace and autoloading are correct by verifying the plugin's composer autoload or manual require.

---

### Task 4: Refactor AdminRoutes to Use PermissionChecker

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AdminRoutes.php`

**Step 1: Add use statement and update DEFAULT_PERMISSIONS reference**

At top of `AdminRoutes.php`, add:
```php
use BigBrotherJunkies\Data\Permissions\PermissionChecker;
```

Replace `AdminRoutes::DEFAULT_PERMISSIONS` constant with a reference:
```php
// Replace the entire DEFAULT_PERMISSIONS const block with:
public const DEFAULT_PERMISSIONS = PermissionChecker::DEFAULT_PERMISSIONS; // Backwards compat — source of truth is PermissionChecker
```

Note: PHP doesn't allow `const = AnotherClass::CONST` directly. Instead, remove the const entirely and update all internal references to `PermissionChecker::DEFAULT_PERMISSIONS`.

**Step 2: Refactor `checkAdminAccess` method**

```php
public function checkAdminAccess(): bool
{
    return PermissionChecker::userCanAny();
}
```

**Step 3: Refactor `checkFeatureAccess` method**

```php
private function checkFeatureAccess(string $feature): bool
{
    return PermissionChecker::userCan($feature);
}
```

**Step 4: Refactor `getUserFeatures` method**

```php
private function getUserFeatures(): array
{
    return PermissionChecker::getUserFeatures();
}
```

**Step 5: Refactor `getSettings` to use PermissionChecker::getPermissionConfig()**

In the `getSettings` callback, replace:
```php
$permissions = get_option('bbj_admin_permissions', self::DEFAULT_PERMISSIONS);
```
with:
```php
$permissions = PermissionChecker::getPermissionConfig();
```

**Step 6: Refactor `simulatePermissions` to use PermissionChecker**

The simulate endpoint manually checks features for a given role. Update it to use `PermissionChecker::getPermissionConfig()` instead of `get_option('bbj_admin_permissions', self::DEFAULT_PERMISSIONS)`.

**Step 7: Test that admin dashboard still loads correctly**

1. Visit `/admin` — tabs should still render based on permissions
2. Visit `/admin/settings` — permission matrix should display correctly
3. Role simulation should still work

**Step 8: Commit**

```bash
git add -A && git commit -m "refactor: extract PermissionChecker from AdminRoutes

Move permission logic to standalone PermissionChecker utility.
AdminRoutes now delegates all permission checks to PermissionChecker.
This makes permission checking available to any route class or plugin code."
```

---

### Task 5: Add Role Members API Endpoint

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AdminRoutes.php`

**Step 1: Register the new route**

In `registerRoutes()`, add after the existing roles route:

```php
// Get users in a specific role (for info icon popovers)
register_rest_route($namespace, '/admin/role-members', [
    'methods' => 'GET',
    'callback' => [$this, 'getRoleMembers'],
    'permission_callback' => [$this, 'checkAdminSettingsAccess'],
    'args' => [
        'role' => [
            'required' => true,
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ],
    ],
]);
```

**Step 2: Implement the callback**

```php
/**
 * Get users who have a specific role
 */
public function getRoleMembers(\WP_REST_Request $request): \WP_REST_Response
{
    $role = $request->get_param('role');

    $users = get_users([
        'role' => $role,
        'number' => 50,
        'orderby' => 'display_name',
        'order' => 'ASC',
    ]);

    $members = array_map(function ($user) {
        return [
            'id' => $user->ID,
            'display_name' => $user->display_name,
            'avatar' => get_avatar_url($user->ID, ['size' => 32]),
        ];
    }, $users);

    return new \WP_REST_Response([
        'role' => $role,
        'count' => count($members),
        'members' => $members,
    ], 200);
}
```

**Step 3: Test the endpoint**

```
GET /wp-json/bbjd/v1/admin/role-members?role=administrator
```

Expected: JSON with count and member array including id, display_name, avatar.

**Step 4: Add frontend API function**

In `C:\xampp\htdocs\bbj-app\src\lib\api\admin.js`, add:

```javascript
export async function getRoleMembers(role) {
  return adminFetch(`/admin/role-members?role=${encodeURIComponent(role)}`);
}
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add role-members API endpoint for permission settings info icons"
```

---

### Task 6: Create usePermissions Hook (Frontend)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\hooks\usePermissions.js`
- Modify: `C:\xampp\htdocs\bbj-app\src\hooks\index.js`

**Step 1: Create the hook**

```javascript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPermissions } from "@/lib/api/admin";

/**
 * Global permissions hook — works in admin pages AND public pages.
 *
 * Usage:
 *   const { permissions, loading, hasPermission } = usePermissions();
 *   if (hasPermission('player_management')) { ... }
 */
export function usePermissions() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    if (didFetch.current) return;
    didFetch.current = true;

    getMyPermissions()
      .then((data) => {
        setPermissions(data.features);
      })
      .catch(() => {
        setPermissions(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, isAuthenticated]);

  const hasPermission = useCallback(
    (feature) => {
      if (!permissions) return false;
      return !!permissions[feature];
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(() => {
    return permissions && Object.keys(permissions).length > 0;
  }, [permissions]);

  return { permissions, loading, hasPermission, hasAnyPermission };
}
```

**Step 2: Export from hooks index**

Add to `C:\xampp\htdocs\bbj-app\src\hooks\index.js`:

```javascript
export { usePermissions } from "./usePermissions";
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add usePermissions hook for global permission checks"
```

---

### Task 7: Refactor AdminLayout to Use usePermissions Hook

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\app\admin\layout.jsx`

**Step 1: Import and use the hook**

Replace the manual permissions fetching in `AdminLayout` with `usePermissions()`. The layout still needs role simulation on top, so it will:

1. Use `usePermissions()` for initial permissions
2. Keep its own `simulatedPermissions` state that overrides when simulating
3. Derive `visibleTabs` from whichever is active (real or simulated)

Replace the permissions-related state and useEffect:

```javascript
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminLayout({ children }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { permissions: realPermissions, loading: permLoading, hasAnyPermission } = usePermissions();
  const [simulatedPermissions, setSimulatedPermissions] = useState(null);
  const [roles, setRoles] = useState([]);
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // The active permissions: simulated if active, otherwise real
  const permissions = simulatedPermissions || realPermissions;

  useEffect(() => {
    if (authLoading || permLoading) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/admin");
      return;
    }

    if (!hasAnyPermission()) {
      setError("You do not have permission to access the admin panel.");
      return;
    }

    // Fetch roles for simulation dropdown (only if admin)
    if (realPermissions?.admin_settings) {
      const SIMULATION_HIDDEN_ROLES = [
        "subscriber", "seo_manager", "seo_editor", "wiki_updater",
        "ad_admin", "ad_manager", "lifetime", "beta_tester",
        "wikiupdate", "legacy", "author", "editor", "contributor",
      ];

      getRoles()
        .then((rolesData) => {
          setRoles(rolesData.filter((r) => !SIMULATION_HIDDEN_ROLES.includes(r.key)));

          // Restore simulation from sessionStorage
          const savedRole = sessionStorage.getItem("bbj_simulate_role");
          if (savedRole) {
            simulatePermissions(savedRole)
              .then((simData) => {
                setSimulatedRole(savedRole);
                setSimulatedPermissions(simData.features);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [authLoading, permLoading, isAuthenticated, realPermissions, router, hasAnyPermission]);
```

Update `handleSimulateRole`:
```javascript
const handleSimulateRole = async (role) => {
  if (!role) {
    setSimulatedRole(null);
    setSimulatedPermissions(null);
    sessionStorage.removeItem("bbj_simulate_role");
    sessionStorage.removeItem("bbj_simulate_role_name");
    return;
  }

  try {
    const data = await simulatePermissions(role);
    setSimulatedRole(role);
    setSimulatedPermissions(data.features);
    sessionStorage.setItem("bbj_simulate_role", role);
    const roleName = roles.find(r => r.key === role)?.name || role;
    sessionStorage.setItem("bbj_simulate_role_name", roleName);
  } catch (err) {
    console.error("Failed to simulate role:", err);
  }
};
```

Update loading check:
```javascript
if (authLoading || permLoading) {
  // existing loading spinner
}
```

Keep the rest of the component (tabs, rendering) as-is — it already uses `permissions` for tab filtering.

**Step 2: Test**

1. Visit `/admin` — tabs should render correctly
2. Role simulation should still work
3. Verify no duplicate API calls in network tab

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: AdminLayout uses usePermissions hook instead of manual fetch"
```

---

### Task 8: Add Role Member Info Icons to Settings Page

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\app\admin\settings\page.jsx`

**Step 1: Add info icon with popover to role column headers**

Add state for the popover:
```javascript
const [rolePopover, setRolePopover] = useState(null); // { role, members, x, y }
const [loadingMembers, setLoadingMembers] = useState(false);
```

Add import:
```javascript
import { getSettings, updateSettings, getRoles, getRoleMembers } from "@/lib/api/admin";
```

Add handler:
```javascript
const handleInfoClick = async (role, event) => {
  // Toggle off if clicking same role
  if (rolePopover?.role === role.key) {
    setRolePopover(null);
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  setLoadingMembers(true);
  setRolePopover({ role: role.key, roleName: role.name, members: [], x: rect.left, y: rect.bottom });

  try {
    const data = await getRoleMembers(role.key);
    setRolePopover((prev) => prev ? { ...prev, members: data.members } : null);
  } catch {
    setRolePopover(null);
  } finally {
    setLoadingMembers(false);
  }
};
```

**Step 2: Update the table header to include info icons**

Replace the role column header `<th>`:

```jsx
<th key={role.key} className="text-center py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
  <div className="flex flex-col items-center gap-1">
    <span className="text-xs">{role.name}</span>
    <button
      onClick={(e) => handleInfoClick(role, e)}
      className="text-slate-400 hover:text-primary-500 transition-colors"
      title={`View users with ${role.name} role`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
</th>
```

**Step 3: Add the popover component**

Add right before `</section>` of the permissions section (before closing the bg-slate-50 div):

```jsx
{/* Role Members Popover */}
{rolePopover && (
  <div className="fixed inset-0 z-50" onClick={() => setRolePopover(null)}>
    <div
      className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px] max-w-[280px]"
      style={{ top: rolePopover.y + 8, left: Math.min(rolePopover.x, window.innerWidth - 300) }}
      onClick={(e) => e.stopPropagation()}
    >
      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
        {rolePopover.roleName}
      </h4>
      {loadingMembers ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
          Loading...
        </div>
      ) : rolePopover.members.length === 0 ? (
        <p className="text-sm text-slate-500">No users with this role</p>
      ) : (
        <ul className="space-y-2">
          {rolePopover.members.map((member) => (
            <li key={member.id} className="flex items-center gap-2">
              <img
                src={member.avatar}
                alt=""
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {member.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400 mt-2">
        {rolePopover.members.length} {rolePopover.members.length === 1 ? "user" : "users"}
      </p>
    </div>
  </div>
)}
```

**Step 4: Test**

1. Visit `/admin/settings`
2. Click info icon next to "Administrator" — should show popover with your name/avatar
3. Click another role — popover should switch
4. Click outside — popover should close

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add role member info icons to feature permissions settings

Click the info icon next to any role column header to see a popover
listing all users with that role (avatar + display name)."
```

---

### Task 9: Final Integration Test & Deploy

**Step 1: Full test pass**

1. Log out completely
2. Log in via Google OAuth → admin badge should appear immediately
3. Navigate to `/admin` → tabs render based on permissions
4. Navigate to `/admin/settings` → permission matrix displays, info icons work
5. Role simulation still works (preview as dropdown)
6. Log out, log back in via email/password → verify everything still works

**Step 2: Build test**

```bash
cd C:\xampp\htdocs\bbj-app && npm run build
```

Ensure no build errors.

**Step 3: Deploy to staging**

Use `/full-push` skill to deploy to staging (git + Vercel + WP plugin).
