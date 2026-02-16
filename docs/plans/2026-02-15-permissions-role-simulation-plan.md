# Permissions & Role Simulation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add role simulation mode to the admin panel so super admins can preview what each role sees, plus fix missing bug_reports permission and update hidden roles list.

**Architecture:** Frontend-only simulation — a dropdown in the admin layout overrides the permissions state with what a selected role would see. One new backend endpoint returns the features for any given role. No auth changes.

**Tech Stack:** PHP (WordPress REST API), React/Next.js (frontend)

---

### Task 1: Add `bug_reports` to DEFAULT_PERMISSIONS

**Files:**
- Modify: `C:/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data/src/Api/AdminRoutes.php:25-61`

**Step 1: Add the missing permission**

In the `DEFAULT_PERMISSIONS` constant, add `bug_reports` after `announcements` (line 60):

```php
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
```

**Step 2: Verify**

Check that the frontend TABS in `layout.jsx:61` references `permission: "bug_reports"` — it already does, so this wires it up.

**Step 3: Commit**

```bash
git add -A && git commit -m "fix: add missing bug_reports to DEFAULT_PERMISSIONS"
```

---

### Task 2: Add `simulate-permissions` endpoint

**Files:**
- Modify: `C:/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data/src/Api/AdminRoutes.php`

**Step 1: Register the route**

In `registerRoutes()`, after the `/admin/roles` route registration (line 270), add:

```php
// Simulate permissions for a role (admin preview)
register_rest_route($namespace, '/admin/simulate-permissions', [
    'methods' => 'GET',
    'callback' => [$this, 'simulatePermissions'],
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

**Step 2: Add the callback method**

Add this method before the `// PERMISSION CALLBACKS` section (before line 1215):

```php
/**
 * Simulate permissions for a given role (admin preview mode)
 */
public function simulatePermissions(\WP_REST_Request $request): \WP_REST_Response
{
    $role = $request->get_param('role');

    // Verify the role exists in WordPress
    global $wp_roles;
    if (!isset($wp_roles->roles[$role])) {
        return new \WP_REST_Response([
            'error' => 'Invalid role',
        ], 400);
    }

    $permissions = get_option('bbj_admin_permissions', self::DEFAULT_PERMISSIONS);

    $features = [];
    foreach ($permissions as $key => $permission) {
        if (in_array($role, $permission['roles'], true)) {
            $features[$key] = [
                'label' => $permission['label'],
                'description' => $permission['description'],
            ];
        }
    }

    return new \WP_REST_Response([
        'role' => $role,
        'features' => $features,
    ], 200);
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add simulate-permissions endpoint for role preview"
```

---

### Task 3: Add frontend API function

**Files:**
- Modify: `C:/xampp/htdocs/bbj-app/src/lib/api/admin.js`

**Step 1: Add the function**

After the `getRoles()` function (line 137), add:

```javascript
export async function simulatePermissions(role) {
  return adminFetch(`/admin/simulate-permissions?role=${encodeURIComponent(role)}`);
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add simulatePermissions API function"
```

---

### Task 4: Update HIDDEN_ROLES list

**Files:**
- Modify: `C:/xampp/htdocs/bbj-app/src/app/admin/settings/page.jsx:6-13`

**Step 1: Update the hidden roles array**

Replace the current `HIDDEN_ROLES` with:

```javascript
const HIDDEN_ROLES = [
  "subscriber",
  "seo_manager",
  "seo_editor",
  "wiki_updater",
  "ad_admin",
  "ad_manager",
  "lifetime",
  "beta_tester",
  "wikiupdate",
  "legacy",
  "author",
  "editor",
  "contributor",
];
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: hide unused roles from permissions grid"
```

---

### Task 5: Add role simulation bar to admin layout

**Files:**
- Modify: `C:/xampp/htdocs/bbj-app/src/app/admin/layout.jsx`

This is the main feature. Add a simulation dropdown + banner to the admin layout.

**Step 1: Add imports**

At the top of `layout.jsx`, update the import from admin.js:

```javascript
import { getMyPermissions, getRoles, simulatePermissions } from "@/lib/api/admin";
```

**Step 2: Add state and simulation logic**

Inside the `AdminLayout` component, after the existing state declarations (after line 73), add:

```javascript
const [roles, setRoles] = useState([]);
const [simulatedRole, setSimulatedRole] = useState(null);
const [realPermissions, setRealPermissions] = useState(null);
```

**Step 3: Update the useEffect**

Modify the existing `checkAccess` useEffect to also fetch roles (only for admins with `admin_settings` permission). Replace the current useEffect (lines 75-99) with:

```javascript
useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        router.push("/login?redirect=/admin");
        return;
      }

      try {
        const data = await getMyPermissions();
        setPermissions(data.features);
        setRealPermissions(data.features);

        if (Object.keys(data.features).length === 0) {
          setError("You do not have permission to access the admin panel.");
          return;
        }

        // Fetch roles for simulation dropdown (only if user has admin_settings)
        if (data.features.admin_settings) {
          try {
            const rolesData = await getRoles();
            const SIMULATION_HIDDEN_ROLES = [
              "subscriber", "seo_manager", "seo_editor", "wiki_updater",
              "ad_admin", "ad_manager", "lifetime", "beta_tester",
              "wikiupdate", "legacy", "author", "editor", "contributor",
            ];
            setRoles(rolesData.filter((r) => !SIMULATION_HIDDEN_ROLES.includes(r.key)));
          } catch {}
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [authLoading, isAuthenticated, router]);
```

**Step 4: Add simulation handler**

After the useEffect, add:

```javascript
const handleSimulateRole = async (role) => {
    if (!role) {
      // Exit simulation
      setSimulatedRole(null);
      setPermissions(realPermissions);
      return;
    }

    try {
      const data = await simulatePermissions(role);
      setSimulatedRole(role);
      setPermissions(data.features);
    } catch (err) {
      console.error("Failed to simulate role:", err);
    }
  };
```

**Step 5: Add simulation UI**

In the JSX, add two things:

**A) Simulation dropdown** — inside the page header div (after the `<p>` subtitle, around line 153), add:

```jsx
{roles.length > 0 && (
  <div className="flex items-center gap-2 mt-3 sm:mt-0">
    <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
      Preview as:
    </label>
    <select
      value={simulatedRole || ""}
      onChange={(e) => handleSimulateRole(e.target.value || null)}
      className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      <option value="">My Permissions</option>
      {roles.map((role) => (
        <option key={role.key} value={role.key}>
          {role.name}
        </option>
      ))}
    </select>
  </div>
)}
```

Also update the header `<div>` to use flexbox so the dropdown sits to the right:

Change the header wrapper from:
```jsx
<div className="mb-8">
```
to:
```jsx
<div className="mb-8 sm:flex sm:items-start sm:justify-between">
```

And wrap the h1 + p in a div:
```jsx
<div>
  <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
    Admin Dashboard
  </h1>
  <p className="mt-1 text-gray-500 dark:text-gray-400">
    Manage content, reports, and site settings
  </p>
</div>
```

**B) Simulation banner** — right after the header div and before the tabs container (before line 157), add:

```jsx
{simulatedRole && (
  <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
        Previewing as: <strong>{roles.find(r => r.key === simulatedRole)?.name || simulatedRole}</strong>
      </span>
    </div>
    <button
      onClick={() => handleSimulateRole(null)}
      className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline"
    >
      Exit Preview
    </button>
  </div>
)}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add role simulation bar to admin layout"
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `AdminRoutes.php` | Add `bug_reports` to DEFAULT_PERMISSIONS, add `simulate-permissions` endpoint + callback |
| `admin.js` | Add `simulatePermissions()` API function |
| `settings/page.jsx` | Update HIDDEN_ROLES with 7 new entries |
| `admin/layout.jsx` | Add simulation dropdown, banner, state management, role fetching |

### Files NOT Changed

- No database schema changes
- No new files created
- No changes to existing permission callbacks
- No auth system modifications
