# Permissions & Role Simulation Design

**Date:** 2026-02-15
**Status:** Approved

## Overview

Enhance the existing Settings > Features tab with a role simulation mode that lets super admins preview the app as any role would see it. No auth changes — purely frontend permission state swapping with one new backend endpoint.

## Decisions

- **Granularity:** Feature-level only (all-or-nothing per feature)
- **Simulation approach:** Frontend-only role preview (no actual auth/role changes)
- **UI location:** Enhance existing Settings > Features tab + simulation bar in admin layout

## What Gets Built

### 1. Role Simulation Bar (admin layout)

- Dropdown in admin layout: `"Preview as: [Administrator v]"`
- When a non-admin role is selected, frontend overrides permissions state with what that role sees
- Visible banner: `"Previewing as: Editor — Exit Preview"` so admin always knows they're in simulation
- Tabs re-filter in real-time based on simulated role
- "Exit Preview" restores actual permissions via `getMyPermissions()`

### 2. New Backend Endpoint

```
GET /bbjd/v1/admin/simulate-permissions?role=editor
```

- Permission: `admin_settings` (only admins can simulate)
- Reads `bbj_admin_permissions` option
- Returns features array for the requested role (same format as `my-permissions`)
- No auth changes, no session modifications

### 3. Settings > Features Tab Polish

- Already has role-vs-feature checkbox grid — keep as-is
- Fix missing `bug_reports` in DEFAULT_PERMISSIONS

### 4. Bug Fix

- Add `bug_reports` to `AdminRoutes::DEFAULT_PERMISSIONS` (currently in frontend TABS but not defined in backend)

## Data Flow

```
Admin clicks "Preview as: Editor"
  -> GET /bbjd/v1/admin/simulate-permissions?role=editor
  -> Backend reads bbj_admin_permissions option
  -> Returns features that 'editor' role has access to
  -> Frontend replaces permissions state with response
  -> Tabs re-filter, pages gate accordingly

Admin clicks "Exit Preview"
  -> Frontend calls getMyPermissions() again
  -> Restores actual admin permissions
```

## What Stays The Same

- Permission storage (`bbj_admin_permissions` wp_option)
- All existing permission callbacks on REST endpoints
- Frontend tab gating via `permissions` state in layout.jsx
- Feature-level granularity
