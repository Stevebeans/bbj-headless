# Frontend Post Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom front-end blog post editor using TipTap in Next.js, with WordPress REST API for CRUD and Claude AI for SEO features.

**Architecture:** TipTap rich text editor as a Next.js client component, WordPress REST endpoints for post CRUD/media/categories, Next.js API routes for AI features (title generation, meta description, alt text). Desktop uses sidebar layout; mobile uses bottom sheet.

**Tech Stack:** Next.js 15, React 19, TipTap (ProseMirror), WordPress REST API, Claude API (Haiku for alt text, Sonnet for SEO), browser-image-compression

**Spec:** `docs/superpowers/specs/2026-03-14-frontend-post-editor-design.md`

---

## Review Errata — MUST READ BEFORE IMPLEMENTING

The following corrections were identified during plan review. **Apply these fixes as you encounter each task:**

### Chunk 1 Fixes
1. **Task 2: PHP namespace is wrong.** Use `namespace BigBrotherJunkies\Data\Api;` and `use BigBrotherJunkies\Data\Permissions\PermissionChecker;` — NOT the `Jesuspended` namespace shown in the code block.
2. **Task 2: Use existing Revalidation utility.** Replace the private `triggerRevalidation()` method with `\BigBrotherJunkies\Data\Utils\Revalidation::revalidatePost($post->post_name);` — the project already has this utility. Delete the `triggerRevalidation()` method entirely.
3. **Task 3: Remove `@tiptap/extension-font-size`** from the install command — this package doesn't exist. Font size can be handled later via TextStyle + custom CSS if needed. Add `@anthropic-ai/sdk` to the install command explicitly.

### Chunk 2 Fixes
4. **Task 4: `adminFetch` is not exported.** Before creating `editor.js`, add `export` to the `adminFetch` function declaration in `src/lib/api/admin.js` (change `async function adminFetch` → `export async function adminFetch`). This is a prerequisite step.
5. **Task 4: `uploadMedia` token import is wrong.** Change `const { getToken } = await import("@/context/AuthContext")` → `const { getToken } = await import("@/lib/auth/cookies")`. That's where `getToken` is actually exported from.
6. **Task 6: Fix `transformPastedHTML`.** Replace the `transformPastedHTML` handler with: `transformPastedText(text) { return text; }` — this is the correct TipTap API for plain-text paste handling.
7. **Task 6: Replace custom events with prop callbacks.** Instead of `window.dispatchEvent(new CustomEvent("editor-set-title", ...))`, pass an `onTitleChange` callback prop from EditorPage → EditorSidebar → CategoryPicker/SEOPanel. Same for image uploads — pass an `onImageUpload` callback to EditorToolbar. Delete Task 16 (event listener wiring) entirely — it's no longer needed.
8. **Task 8: Pass `editor` instance to SEOPanel** so it can call `editor.getText()` instead of using `document.querySelector(".ProseMirror")`.
9. **Task 8: Remove unused `onTitleChange` from EditorSidebar** destructuring, or use it properly now that we're using prop callbacks.

### Chunk 3-4 Fixes
10. **Task 9: `ImageUploader.onUpload` signature mismatch.** The component calls `onUpload(id, url, altText)` with 3 args but EditorSidebar's handler only accepts `(id, url)`. Update the EditorSidebar handler to accept and store the alt text, or simplify by only passing `(id, url)` and handling alt text separately.
11. **Task 13: Install `@heroicons/react` as an explicit first step** before importing `PencilSquareIcon`. Don't bury it as a conditional check.
12. **Task 15: Use a different icon for the Posts tab** — `PencilSquareIcon` is already used for the Content Engine tab. Use `NewspaperIcon` or `DocumentTextIcon` instead.
13. **Task 15: Add badge count for pending reviews.** The spec requires a badge count on the Posts tab. Fetch the pending review count and display it as a badge. The `listDrafts` response already includes `pending_review_count`.
14. **Task 6/16: Add meta description auto-generation on publish.** In the `handlePublish` function, call `generateMeta(editor.getText())` and save the result before changing status. The spec says this should happen automatically on save/publish.
15. **Task 17: Don't use `git add -A`.** Use specific file paths in the commit step.

---

## File Structure

### Next.js (Frontend)

```
src/
├── app/
│   ├── editor/
│   │   ├── page.jsx                  # Draft list page (auth-required)
│   │   ├── new/page.jsx              # New post editor page
│   │   └── [postId]/page.jsx         # Edit existing post page
│   ├── preview/
│   │   └── [postId]/page.jsx         # Preview draft (client component, auth-required)
│   ├── admin/
│   │   └── posts/page.jsx            # Admin review queue
│   └── api/ai/
│       ├── generate-title/route.js   # Claude SEO title generation
│       ├── generate-meta/route.js    # Claude meta description generation
│       └── generate-alt/route.js     # Claude image alt text generation
├── components/editor/
│   ├── EditorPage.jsx                # Main editor layout (toolbar + content + sidebar)
│   ├── EditorToolbar.jsx             # TipTap formatting toolbar buttons
│   ├── EditorSidebar.jsx             # Right sidebar container (category, image, SEO, checklist)
│   ├── CategoryPicker.jsx            # Season dropdown + subcategory picker
│   ├── ImageUploader.jsx             # Drag-and-drop with client-side compression
│   ├── SEOPanel.jsx                  # Title counter, AI generate button, slug field
│   ├── PublishChecklist.jsx          # Green check / red X validation list
│   ├── EmbedModal.jsx                # Twitter/Instagram embed dialog
│   ├── DraftList.jsx                 # List of user's drafts with status indicators
│   ├── MobileSettingsSheet.jsx       # Bottom sheet for sidebar on mobile
│   └── NewPostFAB.jsx               # Floating action button (mobile entry point)
├── lib/api/
│   └── editor.js                     # Editor API client functions (adminFetch wrappers)
```

### WordPress Plugin

```
C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\
├── Api/
│   └── EditorRoutes.php              # All editor REST endpoints (CRUD, media, categories, review)
├── Permissions/
│   └── PermissionChecker.php         # UPDATE: Add blog_writing, blog_publishing, blog_review
└── Plugin.php                        # UPDATE: Register EditorRoutes in initApiRoutes()
```

---

## Chunk 1: WordPress Backend — Permissions & API Endpoints

### Task 1: Add Blog Editor Permissions

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Permissions\PermissionChecker.php` (DEFAULT_PERMISSIONS constant, ~line 16-72)

- [ ] **Step 1: Add blog permission keys to DEFAULT_PERMISSIONS**

Open `PermissionChecker.php` and add three new entries to the `DEFAULT_PERMISSIONS` constant array, following the existing pattern (e.g., `feed_updates`, `content_engine`):

```php
'blog_writing' => [
    'label' => 'Blog Writer (T1)',
    'description' => 'Create and edit blog posts, submit for review',
    'roles' => ['administrator', 'editor', 'author'],
],
'blog_publishing' => [
    'label' => 'Blog Publisher (T2)',
    'description' => 'Create, edit, and directly publish blog posts',
    'roles' => ['administrator', 'editor'],
],
'blog_review' => [
    'label' => 'Blog Reviewer',
    'description' => 'Review, approve, and reject blog post submissions',
    'roles' => ['administrator'],
],
```

- [ ] **Step 2: Verify permissions load correctly**

Test by calling the existing permissions endpoint:
```bash
curl -H "Authorization: Bearer YOUR_JWT" http://bbj.localhost/wp-json/bbjd/v1/admin/my-permissions
```
Expected: Response includes `blog_writing`, `blog_publishing`, `blog_review` in the features list.

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data
git add src/Permissions/PermissionChecker.php
git commit -m "feat(editor): add blog_writing, blog_publishing, blog_review permissions"
```

---

### Task 2: Create EditorRoutes.php — Post CRUD Endpoints

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EditorRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php` (~line 358, in `initApiRoutes()`)

- [ ] **Step 1: Create EditorRoutes.php with route registration**

Create the file at `src/Api/EditorRoutes.php`. Follow the same pattern as `AdminRoutes.php` — class with `register()` method that hooks into `rest_api_init`, and permission callback methods.

```php
<?php

namespace BigBrotherJunkies\Data\Api;

use BigBrotherJunkies\Data\Permissions\PermissionChecker;

class EditorRoutes
{
    private $namespace = 'bbjd/v1';

    public function register()
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes()
    {
        // List user's posts (filterable by status)
        register_rest_route($this->namespace, '/editor/posts', [
            'methods' => 'GET',
            'callback' => [$this, 'listPosts'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Create new post (draft)
        register_rest_route($this->namespace, '/editor/posts', [
            'methods' => 'POST',
            'callback' => [$this, 'createPost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Get single post for editing
        register_rest_route($this->namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getPost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Update post (auto-save & manual save)
        register_rest_route($this->namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updatePost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Delete (trash) a draft
        register_rest_route($this->namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deletePost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Change post status (draft → pending_review → publish)
        register_rest_route($this->namespace, '/editor/posts/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'changeStatus'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Upload media
        register_rest_route($this->namespace, '/editor/media', [
            'methods' => 'POST',
            'callback' => [$this, 'uploadMedia'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Get categories (seasons + subcategories tree)
        register_rest_route($this->namespace, '/editor/categories', [
            'methods' => 'GET',
            'callback' => [$this, 'getCategories'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // Review endpoints (admin only)
        register_rest_route($this->namespace, '/editor/review', [
            'methods' => 'GET',
            'callback' => [$this, 'getReviewQueue'],
            'permission_callback' => [$this, 'canReview'],
        ]);

        register_rest_route($this->namespace, '/editor/review/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'reviewPost'],
            'permission_callback' => [$this, 'canReview'],
        ]);
    }

    // Permission callbacks
    public function canWrite()
    {
        return PermissionChecker::userCan('blog_writing')
            || PermissionChecker::userCan('blog_publishing')
            || PermissionChecker::userCan('blog_review');
    }

    public function canPublish()
    {
        return PermissionChecker::userCan('blog_publishing')
            || PermissionChecker::userCan('blog_review');
    }

    public function canReview()
    {
        return PermissionChecker::userCan('blog_review');
    }

    // --- Post CRUD ---

    public function listPosts(\WP_REST_Request $request)
    {
        $user_id = get_current_user_id();
        $status = $request->get_param('status') ?: 'any';
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 20;

        $args = [
            'post_type' => 'post',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'modified',
            'order' => 'DESC',
        ];

        // Non-reviewers only see their own posts
        if (!$this->canReview()) {
            $args['author'] = $user_id;
        }

        if ($status === 'any') {
            $args['post_status'] = ['draft', 'pending', 'publish'];
        } else {
            $args['post_status'] = $status;
        }

        $query = new \WP_Query($args);
        $posts = [];

        foreach ($query->posts as $post) {
            $posts[] = $this->formatPostForList($post);
        }

        return rest_ensure_response([
            'posts' => $posts,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
            'pending_review_count' => $this->getPendingReviewCount(),
        ]);
    }

    public function createPost(\WP_REST_Request $request)
    {
        $user_id = get_current_user_id();
        $params = $request->get_json_params();

        $post_data = [
            'post_title' => sanitize_text_field($params['title'] ?? 'Untitled Draft'),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_status' => 'draft',
            'post_author' => $user_id,
            'post_type' => 'post',
        ];

        // Set category if provided
        if (!empty($params['category_id'])) {
            $post_data['post_category'] = array_map('intval', (array) $params['category_id']);
        }

        $post_id = wp_insert_post($post_data, true);

        if (is_wp_error($post_id)) {
            return new \WP_REST_Response(['error' => $post_id->get_error_message()], 500);
        }

        // Set featured image if provided
        if (!empty($params['featured_image_id'])) {
            set_post_thumbnail($post_id, intval($params['featured_image_id']));
        }

        // Save meta description and slug
        if (!empty($params['meta_description'])) {
            update_post_meta($post_id, '_bbjd_meta_description', sanitize_text_field($params['meta_description']));
        }

        return rest_ensure_response([
            'id' => $post_id,
            'slug' => get_post_field('post_name', $post_id),
        ]);
    }

    public function getPost(\WP_REST_Request $request)
    {
        $post_id = intval($request->get_param('id'));
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        // Non-reviewers can only edit their own posts
        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        $categories = wp_get_post_categories($post_id, ['fields' => 'all']);
        $thumbnail_id = get_post_thumbnail_id($post_id);

        return rest_ensure_response([
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'status' => $post->post_status,
            'slug' => $post->post_name,
            'author_id' => (int) $post->post_author,
            'categories' => array_map(function ($cat) {
                return [
                    'id' => $cat->term_id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'parent' => $cat->parent,
                ];
            }, $categories),
            'featured_image_id' => $thumbnail_id ? (int) $thumbnail_id : null,
            'featured_image_url' => $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : null,
            'meta_description' => get_post_meta($post_id, '_bbjd_meta_description', true) ?: '',
            'modified' => $post->post_modified_gmt,
            'review_note' => get_post_meta($post_id, '_bbjd_review_note', true) ?: '',
        ]);
    }

    public function updatePost(\WP_REST_Request $request)
    {
        $post_id = intval($request->get_param('id'));
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        $params = $request->get_json_params();
        $update_data = ['ID' => $post_id];

        if (isset($params['title'])) {
            $update_data['post_title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['content'])) {
            $update_data['post_content'] = wp_kses_post($params['content']);
        }
        if (isset($params['slug'])) {
            $update_data['post_name'] = sanitize_title($params['slug']);
        }

        $result = wp_update_post($update_data, true);

        if (is_wp_error($result)) {
            return new \WP_REST_Response(['error' => $result->get_error_message()], 500);
        }

        // Update categories
        if (isset($params['category_id'])) {
            wp_set_post_categories($post_id, array_map('intval', (array) $params['category_id']));
        }

        // Update featured image
        if (isset($params['featured_image_id'])) {
            if ($params['featured_image_id']) {
                set_post_thumbnail($post_id, intval($params['featured_image_id']));
            } else {
                delete_post_thumbnail($post_id);
            }
        }

        // Update meta description
        if (isset($params['meta_description'])) {
            update_post_meta($post_id, '_bbjd_meta_description', sanitize_text_field($params['meta_description']));
        }

        return rest_ensure_response([
            'id' => $post_id,
            'slug' => get_post_field('post_name', $post_id),
            'modified' => get_post_field('post_modified_gmt', $post_id),
        ]);
    }

    public function deletePost(\WP_REST_Request $request)
    {
        $post_id = intval($request->get_param('id'));
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        wp_trash_post($post_id);
        return rest_ensure_response(['success' => true]);
    }

    // --- Status Changes ---

    public function changeStatus(\WP_REST_Request $request)
    {
        $post_id = intval($request->get_param('id'));
        $post = get_post($post_id);
        $params = $request->get_json_params();
        $new_status = sanitize_text_field($params['status'] ?? '');

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        // Publishing requires blog_publishing or blog_review permission
        if ($new_status === 'publish' && !$this->canPublish()) {
            return new \WP_REST_Response(['error' => 'You do not have permission to publish'], 403);
        }

        $wp_status = $new_status === 'pending_review' ? 'pending' : $new_status;
        wp_update_post(['ID' => $post_id, 'post_status' => $wp_status]);

        // Send email notifications
        if ($new_status === 'pending_review') {
            $this->notifyReviewers($post);
        }

        // Trigger revalidation on publish
        if ($new_status === 'publish') {
            $this->triggerRevalidation($post_id);
        }

        return rest_ensure_response([
            'id' => $post_id,
            'status' => $new_status,
        ]);
    }

    // --- Media Upload ---

    public function uploadMedia(\WP_REST_Request $request)
    {
        $files = $request->get_file_params();

        if (empty($files['file'])) {
            return new \WP_REST_Response(['error' => 'No file provided'], 400);
        }

        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $attachment_id = media_handle_upload('file', 0);

        if (is_wp_error($attachment_id)) {
            return new \WP_REST_Response(['error' => $attachment_id->get_error_message()], 500);
        }

        return rest_ensure_response([
            'id' => $attachment_id,
            'url' => wp_get_attachment_url($attachment_id),
            'thumbnail' => wp_get_attachment_image_url($attachment_id, 'thumbnail'),
        ]);
    }

    // --- Categories ---

    public function getCategories(\WP_REST_Request $request)
    {
        $current_season_id = get_option('bbj_v2_current_season', 0);

        // Get all categories that are season parents (top-level)
        $seasons = get_categories([
            'taxonomy' => 'category',
            'parent' => 0,
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'DESC',
        ]);

        $tree = [];
        foreach ($seasons as $season) {
            // Only include "Big Brother" seasons
            if (strpos(strtolower($season->name), 'big brother') === false) {
                continue;
            }

            $children = get_categories([
                'taxonomy' => 'category',
                'parent' => $season->term_id,
                'hide_empty' => false,
                'orderby' => 'name',
                'order' => 'ASC',
            ]);

            $tree[] = [
                'id' => $season->term_id,
                'name' => $season->name,
                'slug' => $season->slug,
                'is_current' => (int) $season->term_id === (int) $current_season_id,
                'subcategories' => array_map(function ($child) {
                    return [
                        'id' => $child->term_id,
                        'name' => $child->name,
                        'slug' => $child->slug,
                    ];
                }, $children),
            ];
        }

        return rest_ensure_response([
            'seasons' => $tree,
            'current_season_id' => (int) $current_season_id,
        ]);
    }

    // --- Review ---

    public function getReviewQueue(\WP_REST_Request $request)
    {
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 20;

        $query = new \WP_Query([
            'post_type' => 'post',
            'post_status' => 'pending',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'modified',
            'order' => 'DESC',
        ]);

        $posts = [];
        foreach ($query->posts as $post) {
            $posts[] = $this->formatPostForList($post);
        }

        return rest_ensure_response([
            'posts' => $posts,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
        ]);
    }

    public function reviewPost(\WP_REST_Request $request)
    {
        $post_id = intval($request->get_param('id'));
        $post = get_post($post_id);
        $params = $request->get_json_params();
        $action = sanitize_text_field($params['action'] ?? '');
        $note = sanitize_text_field($params['note'] ?? '');

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        if ($action === 'approve') {
            wp_update_post(['ID' => $post_id, 'post_status' => 'publish']);
            delete_post_meta($post_id, '_bbjd_review_note');
            $this->notifyAuthor($post, 'approved', $note);
            $this->triggerRevalidation($post_id);
        } elseif ($action === 'reject') {
            wp_update_post(['ID' => $post_id, 'post_status' => 'draft']);
            update_post_meta($post_id, '_bbjd_review_note', $note);
            $this->notifyAuthor($post, 'rejected', $note);
        } else {
            return new \WP_REST_Response(['error' => 'Invalid action'], 400);
        }

        return rest_ensure_response([
            'id' => $post_id,
            'action' => $action,
        ]);
    }

    // --- Helpers ---

    private function formatPostForList($post)
    {
        $thumbnail_id = get_post_thumbnail_id($post->ID);
        $author = get_userdata($post->post_author);

        return [
            'id' => $post->ID,
            'title' => $post->post_title,
            'status' => $post->post_status === 'pending' ? 'pending_review' : $post->post_status,
            'slug' => $post->post_name,
            'author' => $author ? $author->display_name : 'Unknown',
            'modified' => $post->post_modified_gmt,
            'has_featured_image' => (bool) $thumbnail_id,
            'featured_image_thumb' => $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, 'thumbnail') : null,
        ];
    }

    private function getPendingReviewCount()
    {
        $count = wp_count_posts('post');
        return (int) ($count->pending ?? 0);
    }

    private function notifyReviewers($post)
    {
        $admin_email = get_option('admin_email');
        $author = get_userdata($post->post_author);
        $edit_url = home_url('/editor/' . $post->ID);

        wp_mail(
            $admin_email,
            '[BBJ] Post Submitted for Review: ' . $post->post_title,
            sprintf(
                "%s submitted a post for review:\n\n\"%s\"\n\nReview it here: %s",
                $author->display_name,
                $post->post_title,
                $edit_url
            )
        );
    }

    private function notifyAuthor($post, $action, $note)
    {
        $author = get_userdata($post->post_author);
        if (!$author || !$author->user_email) return;

        $subject = $action === 'approved'
            ? '[BBJ] Your post has been published: ' . $post->post_title
            : '[BBJ] Your post needs changes: ' . $post->post_title;

        $message = $action === 'approved'
            ? sprintf("Your post \"%s\" has been approved and published!", $post->post_title)
            : sprintf("Your post \"%s\" has been sent back for changes.\n\nNote: %s\n\nEdit it here: %s",
                $post->post_title,
                $note ?: 'No note provided',
                home_url('/editor/' . $post->ID)
            );

        wp_mail($author->user_email, $subject, $message);
    }

    private function triggerRevalidation($post_id)
    {
        $post = get_post($post_id);
        // Use existing Revalidation utility — do NOT reinvent this
        \BigBrotherJunkies\Data\Utils\Revalidation::revalidatePost($post->post_name);
    }
}
```

- [ ] **Step 2: Register EditorRoutes in Plugin.php**

Open `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php` and add to the `initApiRoutes()` method (around line 358, alongside other route registrations):

```php
$editorRoutes = new EditorRoutes();
$editorRoutes->register();
```

Also add the `use` import at the top of the file:
```php
use BigBrotherJunkies\Data\Api\EditorRoutes;
```

- [ ] **Step 3: Test the endpoints**

```bash
# Test list posts
curl -s -H "Authorization: Bearer YOUR_JWT" http://bbj.localhost/wp-json/bbjd/v1/editor/posts | jq .

# Test create post
curl -s -X POST -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" \
  -d '{"title":"Test Draft","content":"<p>Hello world</p>"}' \
  http://bbj.localhost/wp-json/bbjd/v1/editor/posts | jq .

# Test get categories
curl -s -H "Authorization: Bearer YOUR_JWT" http://bbj.localhost/wp-json/bbjd/v1/editor/categories | jq .
```

Expected: 200 responses with post data and category tree.

- [ ] **Step 4: Clean up test post**

Delete the test post created in step 3 via the API or wp-admin.

- [ ] **Step 5: Commit**

```bash
cd /c/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data
git add src/Api/EditorRoutes.php src/Plugin.php
git commit -m "feat(editor): add EditorRoutes with post CRUD, media upload, categories, and review endpoints"
```

---

### Task 3: Install TipTap Dependencies

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\package.json`

- [ ] **Step 1: Install TipTap and image compression packages**

```bash
cd /c/xampp/htdocs/bbj-app
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder browser-image-compression @anthropic-ai/sdk @heroicons/react
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: No errors, dev server starts on port 3000.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(editor): install TipTap editor and browser-image-compression dependencies"
```

---

## Chunk 2: Frontend API Layer & Editor Core

### Task 4: Create Editor API Client

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\lib\api\editor.js`

- [ ] **Step 1: Create editor.js with all API functions**

Follow the same pattern as `admin.js` — wrappers around `adminFetch()` for each endpoint.

```javascript
import { adminFetch } from "./admin";

// --- Posts ---

export async function listDrafts({ status = "any", page = 1, perPage = 20 } = {}) {
  const params = new URLSearchParams({ status, page, per_page: perPage });
  return adminFetch(`/editor/posts?${params}`);
}

export async function createPost(data) {
  return adminFetch("/editor/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPost(postId) {
  return adminFetch(`/editor/posts/${postId}`);
}

export async function updatePost(postId, data) {
  return adminFetch(`/editor/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId) {
  return adminFetch(`/editor/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function changePostStatus(postId, status) {
  return adminFetch(`/editor/posts/${postId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// --- Media ---

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Must use raw fetch for FormData — adminFetch sets Content-Type: application/json
  const { getToken } = await import("@/context/AuthContext");
  const token = getToken();

  const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.WORDPRESS_API_URL;
  const res = await fetch(`${apiBase}/bbjd/v1/editor/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();
}

// --- Categories ---

export async function getCategories() {
  return adminFetch("/editor/categories");
}

// --- Review ---

export async function getReviewQueue({ page = 1, perPage = 20 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  return adminFetch(`/editor/review?${params}`);
}

export async function reviewPost(postId, action, note = "") {
  return adminFetch(`/editor/review/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ action, note }),
  });
}

// --- AI ---

export async function generateTitle(content, categoryName) {
  const res = await fetch("/api/ai/generate-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, categoryName }),
  });
  if (!res.ok) throw new Error("Failed to generate title");
  return res.json();
}

export async function generateMeta(content) {
  const res = await fetch("/api/ai/generate-meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to generate meta");
  return res.json();
}

export async function generateAltText(imageUrl) {
  const res = await fetch("/api/ai/generate-alt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw new Error("Failed to generate alt text");
  return res.json();
}
```

- [ ] **Step 2: Verify the uploadMedia function handles the token import correctly**

Check that `getToken` is exported from `AuthContext.jsx`. If not, adjust the import pattern to match how `adminFetch` gets the token (likely from cookies directly).

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/editor.js
git commit -m "feat(editor): add editor API client with post CRUD, media, categories, review, and AI functions"
```

---

### Task 5: Create Next.js AI API Routes

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\api\ai\generate-title\route.js`
- Create: `C:\xampp\htdocs\bbj-app\src\app\api\ai\generate-meta\route.js`
- Create: `C:\xampp\htdocs\bbj-app\src\app\api\ai\generate-alt\route.js`

- [ ] **Step 1: Create generate-title route**

```javascript
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { content, categoryName } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Generate an SEO-optimized blog post title for a Big Brother fan site (BigBrotherJunkies.com).

Category: ${categoryName || "General"}

Post content:
${content.substring(0, 2000)}

Requirements:
- 40-60 characters ideal
- Include relevant keywords naturally
- Engaging for Big Brother fans
- Do NOT use clickbait
- Return ONLY the title text, nothing else`,
        },
      ],
    });

    const title = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json({ error: "Failed to generate title" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create generate-meta route**

```javascript
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write an SEO meta description for this Big Brother blog post.

Post content:
${content.substring(0, 3000)}

Requirements:
- 130-155 characters
- Summarize the key topic
- Include a natural call to action
- Return ONLY the meta description text, nothing else`,
        },
      ],
    });

    const description = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ description });
  } catch (error) {
    console.error("Meta generation error:", error);
    return NextResponse.json({ error: "Failed to generate meta description" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create generate-alt route**

```javascript
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Write a concise, descriptive alt text for this image. Context: this is for a Big Brother reality TV fan website. Keep it under 125 characters. Return ONLY the alt text, nothing else.",
            },
          ],
        },
      ],
    });

    const altText = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ altText });
  } catch (error) {
    console.error("Alt text generation error:", error);
    return NextResponse.json({ error: "Failed to generate alt text" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Ensure ANTHROPIC_API_KEY is in .env.local**

Check `.env.local` for `ANTHROPIC_API_KEY`. If not present, add it:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Also check if `@anthropic-ai/sdk` is installed:
```bash
npm list @anthropic-ai/sdk 2>/dev/null || npm install @anthropic-ai/sdk
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/
git commit -m "feat(editor): add AI API routes for title, meta description, and alt text generation"
```

---

### Task 6: Build TipTap EditorPage Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\EditorPage.jsx`

This is the core editor component — TipTap instance, toolbar, auto-save, and layout.

- [ ] **Step 1: Create EditorPage.jsx**

```jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import EditorToolbar from "./EditorToolbar";
import EditorSidebar from "./EditorSidebar";
import MobileSettingsSheet from "./MobileSettingsSheet";
import { createPost, updatePost, changePostStatus, getPost } from "@/lib/api/editor";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function EditorPage({ postId = null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Post state
  const [currentPostId, setCurrentPostId] = useState(postId);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [categoryIds, setCategoryIds] = useState([]);
  const [featuredImageId, setFeaturedImageId] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
  const [metaDescription, setMetaDescription] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  // UI state
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);

  // Auto-save refs
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isFirstSaveRef = useRef(!postId);

  const canPublish = hasPermission("blog_publishing") || hasPermission("blog_review");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Start writing your post..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4",
      },
      // Strip formatting on paste (plain text)
      transformPastedHTML(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || "";
      },
    },
    onUpdate: () => {
      scheduleSave();
    },
  });

  // Load existing post
  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  async function loadPost(id) {
    setIsLoading(true);
    try {
      const data = await getPost(id);
      setTitle(data.title);
      setSlug(data.slug);
      setStatus(data.status === "pending" ? "pending_review" : data.status);
      setCategoryIds(data.categories?.map((c) => c.id) || []);
      setFeaturedImageId(data.featured_image_id);
      setFeaturedImageUrl(data.featured_image_url);
      setMetaDescription(data.meta_description);
      setReviewNote(data.review_note);
      if (editor && data.content) {
        editor.commands.setContent(data.content);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-save logic
  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePost();
    }, 30000);
  }

  const savePost = useCallback(async () => {
    if (isSavingRef.current || !editor) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    const postData = {
      title: title || "Untitled Draft",
      content: editor.getHTML(),
      category_id: categoryIds,
      featured_image_id: featuredImageId,
      meta_description: metaDescription,
      slug,
    };

    try {
      if (isFirstSaveRef.current) {
        // First save — create post
        const result = await createPost(postData);
        setCurrentPostId(result.id);
        setSlug(result.slug);
        isFirstSaveRef.current = false;
        router.replace(`/editor/${result.id}`, { scroll: false });
      } else {
        const result = await updatePost(currentPostId, postData);
        setSlug(result.slug);
      }

      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [title, slug, categoryIds, featuredImageId, metaDescription, editor, currentPostId, router]);

  // Manual save
  async function handleManualSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await savePost();
  }

  // Publish / Submit for review
  async function handlePublish() {
    await handleManualSave();
    if (!currentPostId) return;

    const newStatus = canPublish ? "publish" : "pending_review";
    try {
      await changePostStatus(currentPostId, newStatus);
      setStatus(newStatus);
      if (newStatus === "publish") {
        router.push(`/posts/${slug}`);
      }
    } catch (err) {
      console.error("Status change failed:", err);
    }
  }

  // Preview
  function handlePreview() {
    handleManualSave().then(() => {
      if (currentPostId) {
        window.open(`/preview/${currentPostId}`, "_blank");
      }
    });
  }

  // Title change triggers auto-save schedule
  function handleTitleChange(e) {
    setTitle(e.target.value);
    scheduleSave();
  }

  // Publish checklist
  const checklist = {
    category: categoryIds.length > 0,
    featuredImage: !!featuredImageId,
    title: title.trim().length > 0,
    content: editor ? editor.getText().length >= 100 : false,
  };
  const canSubmit = Object.values(checklist).every(Boolean);

  // Save status display
  function getSaveStatusText() {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved" && lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      if (seconds < 5) return "Saved just now";
      if (seconds < 60) return `Saved ${seconds}s ago`;
      return `Saved ${Math.floor(seconds / 60)}m ago`;
    }
    if (saveStatus === "error") return "Save failed";
    return "Draft";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const sidebarProps = {
    categoryIds,
    setCategoryIds,
    featuredImageId,
    setFeaturedImageId,
    featuredImageUrl,
    setFeaturedImageUrl,
    title,
    slug,
    setSlug,
    metaDescription,
    setMetaDescription,
    checklist,
    saveStatus: getSaveStatusText(),
    reviewNote,
    editor,
    onSave: scheduleSave,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-primary-500 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => router.push("/editor")}
          className="text-white text-sm hover:text-secondary-500 transition"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button onClick={handleManualSave} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition">
            Save Draft
          </button>
          <button onClick={handlePreview} className="px-3 py-1 border border-secondary-500 text-secondary-500 text-sm rounded hover:bg-secondary-500 hover:text-primary-600 transition">
            Preview
          </button>
          <button
            onClick={handlePublish}
            disabled={!canSubmit}
            className="px-3 py-1 bg-secondary-500 text-primary-600 text-sm font-bold rounded hover:bg-secondary-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canPublish ? "Publish" : "Submit for Review"}
          </button>
          {/* Mobile settings toggle */}
          <button
            onClick={() => setMobileSettingsOpen(true)}
            className="md:hidden px-3 py-1 border border-secondary-500 text-secondary-500 text-sm rounded"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Editor area */}
        <div className="flex-1 p-4 md:p-6">
          <EditorToolbar editor={editor} />
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Post title..."
            className="w-full text-2xl font-bold border border-gray-200 rounded-lg p-3 mb-4 focus:outline-none focus:border-primary-400"
          />
          <div className="bg-white border border-gray-200 rounded-lg min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 lg:w-80 border-l border-gray-200 bg-white overflow-y-auto sticky top-[48px] h-[calc(100vh-48px)]">
          <EditorSidebar {...sidebarProps} />
        </div>
      </div>

      {/* Mobile settings sheet */}
      <MobileSettingsSheet
        open={mobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        {...sidebarProps}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify no import errors**

Start the dev server and navigate to a page that doesn't use this component yet — just confirm no build errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/EditorPage.jsx
git commit -m "feat(editor): add EditorPage component with TipTap, auto-save, and sidebar layout"
```

---

### Task 7: Build EditorToolbar Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\EditorToolbar.jsx`

- [ ] **Step 1: Create EditorToolbar.jsx**

```jsx
"use client";

import { useState } from "react";
import EmbedModal from "./EmbedModal";

const COLORS = [
  "#000000", "#E55C41", "#35546e", "#FFBF0F", "#059669",
  "#EF4444", "#6366F1", "#EC4899", "#94A3B8", "#FFFFFF",
];

export default function EditorToolbar({ editor }) {
  const [showColors, setShowColors] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  if (!editor) return null;

  function ToolButton({ onClick, active, children, title }) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`px-2 py-1 text-sm rounded transition ${
          active
            ? "bg-primary-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4 flex flex-wrap gap-1 items-center sticky top-[48px] z-40">
      {/* Text formatting */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Headings */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive("heading", { level: 4 })}
        title="Heading 4"
      >
        H4
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Lists */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        • List
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        1. List
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        " "
      </ToolButton>

      <span className="text-gray-300 mx-1">|</span>

      {/* Link */}
      <ToolButton
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
          }
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        🔗
      </ToolButton>

      {/* Image */}
      <ToolButton
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              // Dispatch custom event for ImageUploader to handle
              window.dispatchEvent(new CustomEvent("editor-image-upload", { detail: { file } }));
            }
          };
          input.click();
        }}
        title="Insert Image"
      >
        📷
      </ToolButton>

      {/* Embed */}
      <ToolButton onClick={() => setShowEmbed(true)} title="Embed Tweet/Instagram">
        📋
      </ToolButton>

      {/* Table */}
      <ToolButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        Table
      </ToolButton>

      {/* Color */}
      <div className="relative">
        <ToolButton onClick={() => setShowColors(!showColors)} title="Text Color">
          🎨
        </ToolButton>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-50 flex flex-wrap gap-1 w-40">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColors(false);
                }}
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setShowColors(false);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
            >
              Reset color
            </button>
          </div>
        )}
      </div>

      {/* Embed modal */}
      {showEmbed && (
        <EmbedModal editor={editor} onClose={() => setShowEmbed(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/EditorToolbar.jsx
git commit -m "feat(editor): add EditorToolbar with formatting, headings, lists, links, images, tables, colors, embeds"
```

---

### Task 8: Build EditorSidebar, CategoryPicker, SEOPanel, PublishChecklist

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\EditorSidebar.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\CategoryPicker.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\SEOPanel.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\PublishChecklist.jsx`

- [ ] **Step 1: Create CategoryPicker.jsx**

```jsx
"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/lib/api/editor";

export default function CategoryPicker({ categoryIds, setCategoryIds, onTitleSuggestion, onSave }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategories();
        setSeasons(data.seasons || []);
        // Default to current season
        const current = data.seasons?.find((s) => s.is_current);
        if (current) {
          setSelectedSeason(current);
          setCategoryIds([current.id]);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSeasonChange(e) {
    const seasonId = parseInt(e.target.value);
    const season = seasons.find((s) => s.id === seasonId);
    setSelectedSeason(season);
    setSelectedSub(null);
    setCategoryIds(season ? [season.id] : []);
    onSave?.();
  }

  function handleSubChange(e) {
    const subId = parseInt(e.target.value);
    const sub = selectedSeason?.subcategories?.find((s) => s.id === subId);
    setSelectedSub(sub);

    if (selectedSeason) {
      const ids = subId ? [selectedSeason.id, subId] : [selectedSeason.id];
      setCategoryIds(ids);
    }

    // Auto-title suggestion based on subcategory
    if (sub && selectedSeason) {
      const seasonName = selectedSeason.name;
      const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric" });

      const subLower = sub.name.toLowerCase();
      if (subLower.includes("live feed")) {
        onTitleSuggestion?.(`${seasonName} - Live Feed Thread For ${today}`);
      } else if (subLower.includes("recap")) {
        onTitleSuggestion?.(`Recap Post For ${seasonName} Feeds From ${yesterday}`);
      }
    }
    onSave?.();
  }

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded" />;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Season</label>
        <select
          value={selectedSeason?.id || ""}
          onChange={handleSeasonChange}
          className="w-full mt-1 p-2 border border-gray-200 rounded text-sm bg-white focus:border-primary-400 focus:outline-none"
        >
          <option value="">Select season...</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name} {season.is_current ? "(Current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason?.subcategories?.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Post Type</label>
          <select
            value={selectedSub?.id || ""}
            onChange={handleSubChange}
            className="w-full mt-1 p-2 border border-gray-200 rounded text-sm bg-white focus:border-primary-400 focus:outline-none"
          >
            <option value="">General</option>
            {selectedSeason.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create SEOPanel.jsx**

```jsx
"use client";

import { useState } from "react";
import { generateTitle } from "@/lib/api/editor";

export default function SEOPanel({ title, slug, setSlug, onSave }) {
  const [generating, setGenerating] = useState(false);

  const titleLength = title?.length || 0;
  const titleColor =
    titleLength >= 40 && titleLength <= 60 ? "text-green-500" :
    titleLength >= 30 && titleLength <= 70 ? "text-yellow-500" : "text-red-500";

  async function handleGenerateTitle() {
    setGenerating(true);
    try {
      // Get editor content from the DOM (it's in a sibling component)
      const editorEl = document.querySelector(".ProseMirror");
      const content = editorEl?.textContent || "";
      const result = await generateTitle(content, "Big Brother");
      // Dispatch event for EditorPage to update title
      window.dispatchEvent(new CustomEvent("editor-set-title", { detail: { title: result.title } }));
    } catch (err) {
      console.error("Title generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">SEO Title</label>
          <span className={`text-xs font-mono ${titleColor}`}>{titleLength}/60</span>
        </div>
        <button
          onClick={handleGenerateTitle}
          disabled={generating}
          className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded text-center transition disabled:opacity-50"
        >
          {generating ? "Generating..." : "✨ Generate AI Title"}
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); onSave?.(); }}
          className="w-full mt-1 p-2 border border-gray-200 rounded text-sm focus:border-primary-400 focus:outline-none text-gray-500"
          placeholder="auto-generated-from-title"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PublishChecklist.jsx**

```jsx
"use client";

export default function PublishChecklist({ checklist }) {
  const items = [
    { key: "category", label: "Category selected" },
    { key: "featuredImage", label: "Featured image uploaded" },
    { key: "title", label: "Title set" },
    { key: "content", label: "Content added (100+ chars)" },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
        Publish Checklist
      </h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm">
            <span className={checklist[item.key] ? "text-green-500" : "text-red-500"}>
              {checklist[item.key] ? "✓" : "✗"}
            </span>
            <span className={checklist[item.key] ? "text-gray-700" : "text-gray-400"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create EditorSidebar.jsx**

```jsx
"use client";

import CategoryPicker from "./CategoryPicker";
import ImageUploader from "./ImageUploader";
import SEOPanel from "./SEOPanel";
import PublishChecklist from "./PublishChecklist";

export default function EditorSidebar({
  categoryIds, setCategoryIds,
  featuredImageId, setFeaturedImageId,
  featuredImageUrl, setFeaturedImageUrl,
  title, slug, setSlug,
  metaDescription, setMetaDescription,
  checklist, saveStatus, reviewNote,
  editor, onSave, onTitleChange,
}) {
  function handleTitleSuggestion(suggestedTitle) {
    // Dispatch to EditorPage
    window.dispatchEvent(new CustomEvent("editor-set-title", { detail: { title: suggestedTitle } }));
  }

  return (
    <div className="p-4 space-y-5">
      <CategoryPicker
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        onTitleSuggestion={handleTitleSuggestion}
        onSave={onSave}
      />

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          Featured Image <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <ImageUploader
            imageId={featuredImageId}
            imageUrl={featuredImageUrl}
            onUpload={(id, url) => {
              setFeaturedImageId(id);
              setFeaturedImageUrl(url);
              onSave?.();
            }}
            onRemove={() => {
              setFeaturedImageId(null);
              setFeaturedImageUrl(null);
              onSave?.();
            }}
          />
        </div>
      </div>

      <SEOPanel title={title} slug={slug} setSlug={setSlug} onSave={onSave} />

      <PublishChecklist checklist={checklist} />

      {/* Save status */}
      <div className="text-xs text-green-600">{saveStatus}</div>

      {/* Review note (if returned from reviewer) */}
      {reviewNote && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">Review Note</h4>
          <p className="text-sm text-red-700">{reviewNote}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/CategoryPicker.jsx src/components/editor/SEOPanel.jsx src/components/editor/PublishChecklist.jsx src/components/editor/EditorSidebar.jsx
git commit -m "feat(editor): add sidebar components — CategoryPicker, SEOPanel, PublishChecklist, EditorSidebar"
```

---

## Chunk 3: Supporting Components & Pages

### Task 9: Build ImageUploader Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\ImageUploader.jsx`

- [ ] **Step 1: Create ImageUploader.jsx**

```jsx
"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { uploadMedia, generateAltText } from "@/lib/api/editor";

export default function ImageUploader({ imageId, imageUrl, onUpload, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const compressAndUpload = useCallback(async (file) => {
    setUploading(true);
    setProgress(10);

    try {
      // Client-side compression
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });
      setProgress(40);

      // Upload to WordPress
      const result = await uploadMedia(compressed);
      setProgress(70);

      // Generate AI alt text
      let altText = "";
      try {
        const altResult = await generateAltText(result.url);
        altText = altResult.altText;
      } catch {
        altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }
      setProgress(100);

      onUpload(result.id, result.url, altText);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      compressAndUpload(file);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) compressAndUpload(file);
  }

  if (imageUrl) {
    return (
      <div className="relative group">
        <img src={imageUrl} alt="Featured" className="w-full rounded-lg border border-gray-200" />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        dragOver ? "border-primary-400 bg-primary-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">Compressing & uploading...</p>
        </div>
      ) : (
        <>
          <div className="text-2xl text-gray-400 mb-1">📷</div>
          <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/ImageUploader.jsx
git commit -m "feat(editor): add ImageUploader with drag-drop, client-side compression, and AI alt text"
```

---

### Task 10: Build EmbedModal and MobileSettingsSheet

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\EmbedModal.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\MobileSettingsSheet.jsx`

- [ ] **Step 1: Create EmbedModal.jsx**

```jsx
"use client";

import { useState } from "react";

export default function EmbedModal({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePreview() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Use WordPress oEmbed proxy
      const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";
      const res = await fetch(
        `${apiBase}/oembed/1.0/proxy?url=${encodeURIComponent(url)}`,
        { headers: { Authorization: `Bearer ${document.cookie.match(/bbj_token=([^;]+)/)?.[1] || ""}` } }
      );

      if (!res.ok) throw new Error("Could not fetch embed");
      const data = await res.json();
      setPreview(data.html);
    } catch {
      setError("Could not load embed preview. Check the URL.");
    } finally {
      setLoading(false);
    }
  }

  function handleInsert() {
    if (!url.trim()) return;

    // Insert as a figure with the embed URL
    const embedHtml = preview
      ? `<figure class="embed-container" data-embed-url="${url}">${preview}</figure>`
      : `<figure class="embed-container"><a href="${url}" target="_blank">${url}</a></figure>`;

    editor.chain().focus().insertContent(embedHtml).run();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Embed Tweet or Instagram</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Twitter or Instagram URL..."
            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-400"
          />
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded hover:bg-primary-400 transition disabled:opacity-50"
          >
            {loading ? "..." : "Preview"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {preview && (
          <div className="border border-gray-200 rounded p-3 mb-4 max-h-60 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="px-4 py-2 bg-secondary-500 text-primary-600 text-sm font-bold rounded hover:bg-secondary-400 transition disabled:opacity-50"
          >
            Insert Embed
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MobileSettingsSheet.jsx**

```jsx
"use client";

import { useEffect, useRef } from "react";
import EditorSidebar from "./EditorSidebar";

export default function MobileSettingsSheet({ open, onClose, ...sidebarProps }) {
  const sheetRef = useRef(null);

  // Close on escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-sm text-secondary-600">Post Settings</h3>
          <button onClick={onClose} className="text-gray-400 text-lg">✕</button>
        </div>

        <EditorSidebar {...sidebarProps} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add slide-up animation to globals.css**

Add to `src/styles/globals.css`:

```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/EmbedModal.jsx src/components/editor/MobileSettingsSheet.jsx src/styles/globals.css
git commit -m "feat(editor): add EmbedModal for Twitter/Instagram and MobileSettingsSheet bottom drawer"
```

---

### Task 11: Create Editor Pages (routes)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\editor\page.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\app\editor\new\page.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\app\editor\[postId]\page.jsx`

- [ ] **Step 1: Create /editor page (draft list)**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import DraftList from "@/components/editor/DraftList";

export default function EditorIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const hasBlogAccess = hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review");

  if (!hasBlogAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You don't have permission to access the editor.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-display">My Posts</h1>
        <button
          onClick={() => router.push("/editor/new")}
          className="btn-primary px-4 py-2 text-sm"
        >
          + New Post
        </button>
      </div>
      <DraftList isAdmin={hasPermission("blog_review")} />
    </div>
  );
}
```

- [ ] **Step 2: Create /editor/new page**

```jsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EditorPage from "@/components/editor/EditorPage";

export default function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return <EditorPage />;
}
```

- [ ] **Step 3: Create /editor/[postId] page**

```jsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import EditorPage from "@/components/editor/EditorPage";

export default function EditPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { postId } = useParams();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return <EditorPage postId={parseInt(postId)} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/editor/
git commit -m "feat(editor): add editor route pages — draft list, new post, and edit post"
```

---

### Task 12: Build DraftList Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\DraftList.jsx`

- [ ] **Step 1: Create DraftList.jsx**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listDrafts, deletePost } from "@/lib/api/editor";

const STATUS_LABELS = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  publish: { label: "Published", color: "bg-green-100 text-green-700" },
};

export default function DraftList({ isAdmin = false }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("any");

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await listDrafts({ status: filter });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId) {
    if (!confirm("Move this draft to trash?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["any", "draft", "pending_review", "publish"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded transition ${
              filter === s ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "any" ? "All" : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Click "New Post" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.draft;
            return (
              <div
                key={post.id}
                onClick={() => router.push(`/editor/${post.id}`)}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer transition"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {post.featured_image_thumb ? (
                    <img src={post.featured_image_thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📝</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title || "Untitled Draft"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {isAdmin && <span className="text-xs text-gray-400">by {post.author}</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(post.modified + "Z").toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {post.status === "draft" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                    className="text-gray-300 hover:text-red-500 text-sm transition"
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/DraftList.jsx
git commit -m "feat(editor): add DraftList component with status filters, thumbnails, and delete"
```

---

## Chunk 4: Entry Points, Preview, Admin Tab & Integration

### Task 13: Add Entry Points (FAB + Header Compose Icon)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\editor\NewPostFAB.jsx`
- Modify: `C:\xampp\htdocs\bbj-app\src\app\layout.jsx` (~line 132-134, alongside other FABs)
- Modify: `C:\xampp\htdocs\bbj-app\src\components\layout\Header.jsx` (~line 120-132, before notification bell)

- [ ] **Step 1: Create NewPostFAB.jsx**

```jsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function NewPostFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Hide on editor pages, when not logged in, or no blog permission
  if (!user) return null;
  if (pathname?.startsWith("/editor")) return null;

  const hasBlogAccess = hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review");
  if (!hasBlogAccess) return null;

  return (
    <button
      onClick={() => router.push("/editor/new")}
      className="fixed bottom-6 right-6 w-14 h-14 bg-secondary-500 rounded-full shadow-lg flex items-center justify-center text-primary-600 text-2xl hover:bg-secondary-400 transition z-40 md:hidden"
      title="New Post"
    >
      ✏️
    </button>
  );
}
```

- [ ] **Step 2: Add NewPostFAB to root layout**

In `src/app/layout.jsx`, import and add `<NewPostFAB />` alongside the other FABs (around line 132-134):

```jsx
import NewPostFAB from "@/components/editor/NewPostFAB";
```

Add `<NewPostFAB />` after the existing FABs (e.g., after `<BackToTop />`).

- [ ] **Step 3: Add compose icon to Header**

In `src/components/layout/Header.jsx`, add a compose button before the notification bell (around line 120-132). Import `usePermissions` and add:

```jsx
import { usePermissions } from "@/hooks/usePermissions";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
```

In the header's icon row, before `<NotificationBell />`, add:

```jsx
{(hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review")) && (
  <Link href="/editor/new" className="text-white hover:text-secondary-500 transition hidden md:block" title="New Post">
    <PencilSquareIcon className="w-5 h-5" />
  </Link>
)}
```

Make sure `@heroicons/react` is installed. If not:
```bash
npm list @heroicons/react 2>/dev/null || npm install @heroicons/react
```

- [ ] **Step 4: Verify entry points render**

Start dev server, log in as admin, and verify:
- Mobile: yellow FAB visible at bottom-right (not on `/editor` pages)
- Desktop: pen icon visible in header next to notification bell
- Both navigate to `/editor/new`

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/NewPostFAB.jsx src/app/layout.jsx src/components/layout/Header.jsx
git commit -m "feat(editor): add NewPostFAB and header compose icon entry points"
```

---

### Task 14: Create Preview Page

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\preview\[postId]\page.jsx`

- [ ] **Step 1: Create preview page**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/api/editor";

export default function PreviewPage() {
  const { postId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user && postId) {
      loadPost();
    }
  }, [user, authLoading, postId]);

  async function loadPost() {
    try {
      const data = await getPost(parseInt(postId));
      setPost(data);
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Preview banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-bold sticky top-0 z-50">
        ⚠️ PREVIEW MODE — This post is not live
        <button
          onClick={() => router.push(`/editor/${postId}`)}
          className="ml-4 underline hover:no-underline"
        >
          Back to Editor
        </button>
      </div>

      {/* Render post using same styles as live posts */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {post.featured_image_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img src={post.featured_image_url} alt={post.title} className="w-full" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-8">
          Draft • {new Date(post.modified + "Z").toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          })}
        </div>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/preview/
git commit -m "feat(editor): add preview page for draft posts with preview banner"
```

---

### Task 15: Add Admin Posts Tab

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\admin\posts\page.jsx`
- Modify: `C:\xampp\htdocs\bbj-app\src\app\admin\layout.jsx` (~line 107-120, TABS array)

- [ ] **Step 1: Add "Posts" tab to admin layout TABS array**

In `src/app/admin/layout.jsx`, add a new entry to the TABS array (around line 107-120):

```javascript
{
  id: "posts",
  label: "Posts",
  href: "/admin/posts",
  icon: PencilSquareIcon,
  permission: "blog_review",
},
```

Import `PencilSquareIcon` if not already imported:
```javascript
import { PencilSquareIcon } from "@heroicons/react/24/outline";
```

- [ ] **Step 2: Create admin posts page**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getReviewQueue, reviewPost } from "@/lib/api/editor";
import DraftList from "@/components/editor/DraftList";

export default function AdminPostsPage() {
  const router = useRouter();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQueue(); }, []);

  async function loadQueue() {
    try {
      const data = await getReviewQueue();
      setReviewQueue(data.posts || []);
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(postId) {
    try {
      await reviewPost(postId, "approve");
      setReviewQueue((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }

  async function handleReject(postId) {
    const note = window.prompt("Rejection note (optional):");
    try {
      await reviewPost(postId, "reject", note || "");
      setReviewQueue((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Reject failed:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Review Queue */}
      {reviewQueue.length > 0 && (
        <div>
          <h2 className="text-lg font-bold font-display mb-3">
            Pending Review <span className="text-secondary-500">({reviewQueue.length})</span>
          </h2>
          <div className="space-y-2">
            {reviewQueue.map((post) => (
              <div key={post.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title || "Untitled"}</p>
                  <p className="text-xs text-gray-500">by {post.author} • {new Date(post.modified + "Z").toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/editor/${post.id}`)}
                    className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(post.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Posts */}
      <div>
        <h2 className="text-lg font-bold font-display mb-3">All Posts</h2>
        <DraftList isAdmin={true} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/posts/ src/app/admin/layout.jsx
git commit -m "feat(editor): add admin Posts tab with review queue and approval/rejection"
```

---

### Task 16: Wire Up EditorPage Event Listeners & Image Upload

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\components\editor\EditorPage.jsx`

The EditorToolbar and SEOPanel dispatch custom events for title changes and image uploads. Wire those up in EditorPage.

- [ ] **Step 1: Add event listeners to EditorPage**

Add these inside the `EditorPage` component, after the state declarations:

```jsx
// Listen for title suggestions from CategoryPicker and AI generator
useEffect(() => {
  function handleSetTitle(e) {
    setTitle(e.detail.title);
    scheduleSave();
  }
  window.addEventListener("editor-set-title", handleSetTitle);
  return () => window.removeEventListener("editor-set-title", handleSetTitle);
}, []);

// Listen for inline image uploads from toolbar
useEffect(() => {
  async function handleImageUpload(e) {
    const { file } = e.detail;
    if (!file || !editor) return;

    try {
      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });

      const { uploadMedia, generateAltText } = await import("@/lib/api/editor");
      const result = await uploadMedia(compressed);

      let alt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      try {
        const altResult = await generateAltText(result.url);
        alt = altResult.altText;
      } catch {}

      editor.chain().focus().setImage({ src: result.url, alt }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }
  window.addEventListener("editor-image-upload", handleImageUpload);
  return () => window.removeEventListener("editor-image-upload", handleImageUpload);
}, [editor]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/EditorPage.jsx
git commit -m "feat(editor): wire up event listeners for title suggestions and inline image uploads"
```

---

### Task 17: End-to-End Smoke Test

- [ ] **Step 1: Start dev server and log in**

```bash
cd /c/xampp/htdocs/bbj-app && npm run dev
```

Navigate to localhost:3000, log in as admin.

- [ ] **Step 2: Test entry points**

- Verify pen icon appears in header (desktop)
- Verify FAB appears on mobile viewport
- Click pen icon → navigates to `/editor/new`

- [ ] **Step 3: Test editor flow**

- Select season + subcategory → verify auto-title populates
- Type content in the editor → verify toolbar works (bold, headings, etc.)
- Upload featured image → verify compression + upload + thumbnail preview
- Wait 30 seconds → verify auto-save fires ("Saved just now" appears)
- Click "Preview" → verify new tab opens with preview banner
- Verify publish checklist shows green checks as fields are filled

- [ ] **Step 4: Test draft list**

- Navigate to `/editor` → verify draft appears in list
- Click draft → verify it loads in editor with all content

- [ ] **Step 5: Test review flow (if possible)**

- Submit a post for review → verify status changes
- Check admin panel Posts tab → verify post appears in review queue
- Approve → verify post publishes

- [ ] **Step 6: Commit any fixes from smoke testing**

```bash
git add -A
git commit -m "fix(editor): smoke test fixes"
```
