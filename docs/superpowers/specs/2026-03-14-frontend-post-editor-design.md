# Frontend Post Editor — Design Spec

## Overview

A custom front-end blog post editor for Big Brother Junkies, replacing the need for writers to use WordPress's Gutenberg editor. The editor is focused on Big Brother content with smart defaults (auto-titles, category presets) while remaining simple enough for non-technical writers to use from their phones.

**Architecture:** Frontend-heavy (Approach A). TipTap editor in Next.js, WordPress REST API for CRUD, Claude API for AI features (title generation, meta descriptions, alt text). Writers never touch wp-admin.

## Page Structure & Routing

### New Pages

- `/editor` — Draft list + "New Post" button. Shows the current user's drafts. For admins/reviewers, shows all drafts with status filters.
- `/editor/new` — Fresh editor with empty fields, current season pre-selected.
- `/editor/[postId]` — Edit existing draft or post.

All editor pages are client components behind authentication. Unauthorized users are redirected to the home page.

### New Components

All live under `src/components/editor/`:

| Component | Purpose |
|-----------|---------|
| `EditorPage.jsx` | Main editor layout — toolbar, content area, sidebar |
| `EditorToolbar.jsx` | TipTap formatting toolbar buttons |
| `EditorSidebar.jsx` | Right sidebar — category, image, SEO, publish checklist |
| `DraftList.jsx` | List of user's drafts with status indicators |
| `EmbedModal.jsx` | Twitter/Instagram embed dialog (toolbar button → URL input → preview) |
| `ImageUploader.jsx` | Drag-and-drop with client-side compression |
| `PublishChecklist.jsx` | Green check / red X validation list |
| `SEOPanel.jsx` | Title character counter, AI generate button, slug field |
| `CategoryPicker.jsx` | Season dropdown + subcategory picker |
| `NewPostFAB.jsx` | Floating action button for mobile, added to root layout |
| `MobileSettingsSheet.jsx` | Bottom sheet for sidebar content on mobile |

### Entry Points (Permission-Gated)

- **Mobile:** `NewPostFAB.jsx` — fixed bottom-right, 56px circle, BBJ yellow (#FFBF0F), pen/compose icon. Only on non-editor pages. Hidden for unauthorized users.
- **Desktop:** Compose icon added to `Header.jsx` — positioned left of the notification bell icon. Same permission gate.

Both render only if the user has any blog permission (`blog_writing`, `blog_publishing`, or `blog_review`). This uses the existing `usePermissions()` hook pattern — check `permissions?.blog_writing || permissions?.blog_publishing || permissions?.blog_review`.

## WordPress API Endpoints

New route file: `src/Api/EditorRoutes.php` in the `bigbrotherjunkies-data` plugin.

### Post CRUD

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bbjd/v1/editor/posts` | GET | List user's drafts/posts (filterable by status) |
| `/bbjd/v1/editor/posts` | POST | Create new post (draft) |
| `/bbjd/v1/editor/posts/{id}` | GET | Get single post for editing (raw content) |
| `/bbjd/v1/editor/posts/{id}` | PUT | Update post (auto-save & manual save) |
| `/bbjd/v1/editor/posts/{id}` | DELETE | Trash a draft |
| `/bbjd/v1/editor/posts/{id}/status` | PUT | Change status. Body: `{ status: "pending_review" \| "publish" }`. Only the post author (for submit) or `blog_publishing`/`blog_review` users (for publish) can call this. |

### Media

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bbjd/v1/editor/media` | POST | Upload image to WordPress Media Library |

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bbjd/v1/editor/categories` | GET | Seasons + subcategories as a simplified tree |

### Review

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bbjd/v1/editor/review` | GET | All posts pending review (admin only) |
| `/bbjd/v1/editor/review/{id}` | PUT | Approve (publishes) or reject with note. Body: `{ action: "approve" \| "reject", note: "optional feedback" }`. Separate from the status endpoint — this is the admin review action, the status endpoint is for the writer's own submissions. |

### Permissions

- All endpoints require JWT Bearer token authentication.
- Post CRUD scoped to user's own posts unless admin.
- Status change to `publish` requires `blog_publishing` or `blog_review`.
- Review endpoints require `blog_review`.
- New permission keys added to `AdminRoutes::DEFAULT_PERMISSIONS`:
  - `blog_writing` — can create/edit posts, submit for review (T1 writers)
  - `blog_publishing` — can create/edit and directly publish (T2 writers)
  - `blog_review` — can see all posts, approve/reject, publish anything (admins)
- These follow the existing feature-descriptive naming convention (like `comment_moderation`, `feed_updates`, `content_engine`).

## Next.js API Routes

Server-side routes to keep API keys safe:

| Endpoint | Description |
|----------|-------------|
| `/api/ai/generate-title` | Sends post content + category context to Claude, returns SEO-optimized title |
| `/api/ai/generate-meta` | Sends post content to Claude, returns meta description |
| `/api/ai/generate-alt` | Sends image to Claude (Haiku for speed/cost), returns alt text |

## Editor Features

### TipTap Configuration

**Extensions:** StarterKit (bold, italic, headings H2-H4, bullet list, ordered list, blockquote), Table, TextStyle, Color, FontSize, Link, Image, Placeholder.

**Excluded:** Code blocks, strikethrough, highlight.

**Paste handling:** Plain text by default (strips Word/Google Docs formatting). Images paste directly.

### Category Picker

1. Fetch `/bbjd/v1/editor/categories` on load — returns seasons with subcategories.
2. Season dropdown defaults to "current season" from WP option `bbj_v2_current_season` (matches existing codebase convention used by SpoilerBarRoutes, FeedUpdateRoutes, HomeRoutes).
3. Subcategory dropdown populates based on selected season.
4. Subcategory selection triggers auto-title:
   - **Live Feed Thread** → `"Big Brother {season#} - Live Feed Thread For {today's date}"`
   - **Recap** → `"Recap Post For Big Brother {season#} Feeds From {yesterday's date}"`
   - **Gossip/News or General** → blank title, AI generate button prominent
5. Auto-titles are always editable.

### Auto-Save

- Debounced — saves 30 seconds after last keystroke.
- First save creates the post via POST, subsequent saves use PUT.
- URL updates after first save via `router.replace()`: `/editor/new` → `/editor/{postId}`.
- Auto-save debounce pauses until first POST completes to prevent duplicate post creation from rapid typing.
- Component handles both "no ID yet" and "has ID" states.
- Status indicator in sidebar: "Saving..." → "Saved 2s ago".

### Image Handling

- **Client-side compression:** Resize to max 1600px width, compress to ~80% JPEG quality using canvas API before upload.
- **Upload:** POST to `/bbjd/v1/editor/media` using `FormData` (not JSON — must omit default `Content-Type` header so browser sets `multipart/form-data` boundary). Stores in WordPress Media Library.
- **Alt text:** AI-generated via `/api/ai/generate-alt` (Claude Haiku), editable by writer.
- **Insertion:** Centered, full width, with alt text attribute.
- **Featured image:** Same uploader component, saves as post thumbnail via the update endpoint.

### Embeds (Twitter/Instagram)

- Dedicated "Embed" toolbar button (no auto-detect on paste).
- Opens modal → writer pastes URL → preview rendered via WordPress oEmbed proxy endpoint (`/wp-json/oembed/1.0/proxy?url=...`, requires authentication).
- Inserted as embed block in content.

### SEO

- **Title counter:** Color-coded character count — green (40-60), yellow (30-39 or 61-70), red (<30 or >70).
- **AI title:** Button generates SEO title via Claude, considering post content + category. Regenerate button available.
- **Meta description:** Auto-generated on save/publish via `/api/ai/generate-meta`. No manual field.
- **Slug:** Auto-generated from title on first save, editable after.
- **OG tags:** Handled at page level in `/posts/[slug]/page.jsx` using featured image + meta description.

### Publish Checklist

Lives at the bottom of the sidebar. All must be green to enable the Publish/Submit button:

- ✓/✗ Category selected
- ✓/✗ Featured image uploaded
- ✓/✗ Title set (not empty)
- ✓/✗ Content minimum length (~100 characters)

### Preview

- Saves current draft, opens `/preview/[postId]` in a new tab.
- `/preview/[postId]` is a new Next.js page (client component, auth-required) that:
  - Fetches the draft via `adminFetch()` → `GET /bbjd/v1/editor/posts/{id}` (authenticated, returns raw content)
  - Renders it using the same post template/styles as `/posts/[slug]/page.jsx`
  - Shows a "Preview Mode" banner at top so it's clear this isn't live
- This avoids the problem of Server Components needing JWT tokens — the preview page is a client component that handles auth natively.

## Writer Tiers & Permissions

### Permission Keys

| Permission | Create | Publish | Review Queue | Notifications |
|------------|--------|---------|-------------|---------------|
| `blog_writing` | Yes | No — "Submit for Review" | No | When post is published/rejected |
| `blog_publishing` | Yes | Yes — direct publish | No | — |
| `blog_review` | Yes | Yes | Yes — sees all pending | Email + admin badge on submissions |

These integrate with the existing `AdminRoutes::DEFAULT_PERMISSIONS` system. Each key maps WP roles to the feature (e.g., `'blog_review' => ['administrator']`). Admin/administrator automatically gets `blog_review`. Users can hold blog permissions alongside other permissions (feed_updates, content_engine, etc.).

**Email notifications** use WordPress `wp_mail()` — same as existing WP notification patterns. Triggered server-side when status changes to `pending_review` (notifies admins) or when admin approves/rejects (notifies writer).

### T1 Flow

1. Writer creates post, fills required fields.
2. Clicks "Submit for Review" → status = `pending_review`.
3. Admin gets email + badge count on admin "Posts" tab.
4. Admin opens post in `/editor/{id}`, makes fixes if needed.
5. Clicks "Publish" → post goes live. Writer optionally notified via email.

### T2 Flow

1. Writer creates post, fills required fields.
2. Clicks "Publish" → post goes live immediately.

### Admin Panel

- New "Posts" tab in admin layout — **separate from** the existing "Content" tab (which is the Content Engine for AI-generated/social media content). The Content Engine manages `bbj_content_queue` entries; the new Posts tab manages standard `wp_posts`. Different systems, different purposes.
- Tab gated by `blog_review` permission in the admin TABS array.
- Shows all posts across writers, filterable by status (Draft / Pending Review / Published).
- Badge count on tab for pending review count.

## Desktop Layout

**Sidebar layout (always visible):**
- Editor on the left (~70% width) — toolbar at top, title field, content area.
- Sidebar on the right (~30% width) — season/category picker, featured image uploader, SEO panel, slug, publish checklist.
- Top bar: "Back to Site" link, Save Draft button, Preview button, Publish/Submit button.
- Sidebar scrolls independently from the editor.

## Mobile Layout (< 768px)

- **Toolbar:** Sticky top, always visible, horizontally scrollable if needed.
- **Title & editor:** Full width, fills viewport.
- **Sidebar content:** Moves to a slide-up bottom sheet triggered by "Settings" button in header bar. Covers ~60% of screen, draggable handle to dismiss.
- **Action buttons:** Save Draft, Preview, Publish/Submit in the top header bar.
- **FAB:** 56px yellow circle, bottom-right, pen icon. Hidden on editor pages and for unauthorized users.
- **Image upload:** Tap opens native file picker (camera roll or camera). Client-side compression critical for phone photos.

## Data Flow

```
Writer types in TipTap editor
  ↓
30s debounce triggers auto-save
  ↓
EditorPage calls adminFetch() → PUT /bbjd/v1/editor/posts/{id}
  ↓
WordPress saves post as draft (wp_posts table, standard WP post)
  ↓
On "Publish" / "Submit for Review":
  ↓
PUT /bbjd/v1/editor/posts/{id}/status
  ↓
If T1: status → pending_review, email + badge notification to admin
If T2: status → publish, post goes live
  ↓
Next.js revalidation triggered (same webhook system already in place)
```

## Dependencies

**New npm packages:**
- `@tiptap/react` + `@tiptap/starter-kit` — editor core
- `@tiptap/extension-table` — table support
- `@tiptap/extension-color` + `@tiptap/extension-text-style` — text colors
- `@tiptap/extension-link` — link handling
- `@tiptap/extension-image` — image insertion
- `@tiptap/extension-placeholder` — placeholder text
- `browser-image-compression` — client-side image compression

**WordPress plugin changes:**
- New file: `src/Api/EditorRoutes.php`
- Updated: `src/Plugin.php` (register new routes)
- Updated: `src/Api/AdminRoutes.php` (add blog permissions to defaults)

## Out of Scope (Future)

- Live feed widget embedded in Live Feed Thread posts (separate build)
- Multi-show support (Survivor, etc.) — BBJ stays Big Brother only
- Scheduled publishing — can add later
- Revision history / diff view — WordPress tracks revisions natively, UI can come later
