<?php

namespace BigBrotherJunkies\Data\Api;

use BigBrotherJunkies\Data\Permissions\PermissionChecker;

class EditorRoutes
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';

        // --- Post CRUD ---

        register_rest_route($namespace, '/editor/posts', [
            'methods' => 'GET',
            'callback' => [$this, 'getPosts'],
            'permission_callback' => [$this, 'canWrite'],
            'args' => [
                'page' => ['default' => 1, 'type' => 'integer'],
                'per_page' => ['default' => 20, 'type' => 'integer'],
                'status' => ['default' => '', 'type' => 'string'],
            ],
        ]);

        register_rest_route($namespace, '/editor/posts', [
            'methods' => 'POST',
            'callback' => [$this, 'createPost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        register_rest_route($namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getPost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        register_rest_route($namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updatePost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        register_rest_route($namespace, '/editor/posts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deletePost'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        register_rest_route($namespace, '/editor/posts/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'changeStatus'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // --- Media ---

        register_rest_route($namespace, '/editor/media', [
            'methods' => 'POST',
            'callback' => [$this, 'uploadMedia'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // --- Categories ---

        register_rest_route($namespace, '/editor/categories', [
            'methods' => 'GET',
            'callback' => [$this, 'getCategories'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        // --- Review ---

        register_rest_route($namespace, '/editor/review', [
            'methods' => 'GET',
            'callback' => [$this, 'getReviewQueue'],
            'permission_callback' => [$this, 'canReview'],
            'args' => [
                'page' => ['default' => 1, 'type' => 'integer'],
                'per_page' => ['default' => 20, 'type' => 'integer'],
            ],
        ]);

        register_rest_route($namespace, '/editor/review/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'reviewPost'],
            'permission_callback' => [$this, 'canReview'],
        ]);
    }

    // --- Permission Callbacks ---

    public function canWrite(): bool
    {
        return PermissionChecker::userCan('blog_writing')
            || PermissionChecker::userCan('blog_publishing')
            || PermissionChecker::userCan('blog_review');
    }

    public function canPublish(): bool
    {
        return PermissionChecker::userCan('blog_publishing')
            || PermissionChecker::userCan('blog_review');
    }

    public function canReview(): bool
    {
        return PermissionChecker::userCan('blog_review');
    }

    // --- Post CRUD ---

    public function getPosts(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $status = sanitize_text_field($request->get_param('status'));
        $offset = ($page - 1) * $perPage;
        $currentUserId = get_current_user_id();
        $isReviewer = $this->canReview();

        $queryArgs = [
            'post_type' => 'post',
            'posts_per_page' => $perPage,
            'offset' => $offset,
            'orderby' => 'modified',
            'order' => 'DESC',
        ];

        // Status filter
        if ($status) {
            $queryArgs['post_status'] = $status;
        } else {
            $queryArgs['post_status'] = ['draft', 'pending', 'publish', 'private'];
        }

        // Non-reviewers only see their own posts
        if (!$isReviewer) {
            $queryArgs['author'] = $currentUserId;
        }

        $query = new \WP_Query($queryArgs);
        $posts = array_map([$this, 'formatPostListItem'], $query->posts);

        // Get pending review count
        $pendingArgs = [
            'post_type' => 'post',
            'post_status' => 'pending',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ];
        if (!$isReviewer) {
            $pendingArgs['author'] = $currentUserId;
        }
        $pendingQuery = new \WP_Query($pendingArgs);
        $pendingCount = $pendingQuery->found_posts;

        return new \WP_REST_Response([
            'items' => $posts,
            'pending_review_count' => $pendingCount,
            'pagination' => [
                'total' => $query->found_posts,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($query->found_posts / $perPage),
            ],
        ]);
    }

    public function createPost(\WP_REST_Request $request): \WP_REST_Response
    {
        $params = $request->get_json_params();

        $postData = [
            'post_title' => sanitize_text_field($params['title'] ?? 'Untitled'),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_status' => 'draft',
            'post_author' => get_current_user_id(),
            'post_type' => 'post',
        ];

        if (!empty($params['category_id'])) {
            $postData['post_category'] = [(int) $params['category_id']];
        }

        $postId = wp_insert_post($postData, true);

        if (is_wp_error($postId)) {
            return new \WP_REST_Response([
                'error' => $postId->get_error_message(),
            ], 500);
        }

        // Set featured image
        if (!empty($params['featured_image_id'])) {
            set_post_thumbnail($postId, (int) $params['featured_image_id']);
        }

        // Set meta description
        if (isset($params['meta_description'])) {
            update_post_meta($postId, '_bbj_meta_description', sanitize_text_field($params['meta_description']));
        }

        return new \WP_REST_Response([
            'success' => true,
            'id' => $postId,
        ], 201);
    }

    public function getPost(\WP_REST_Request $request): \WP_REST_Response
    {
        $postId = (int) $request->get_param('id');
        $post = get_post($postId);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        // Ownership check for non-reviewers
        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        $categories = wp_get_post_categories($postId, ['fields' => 'all']);
        $categoryData = array_map(function ($cat) {
            return [
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'parent' => $cat->parent,
            ];
        }, $categories);

        $thumbnailId = get_post_thumbnail_id($postId);
        $featuredImage = null;
        if ($thumbnailId) {
            $featuredImage = [
                'id' => (int) $thumbnailId,
                'url' => wp_get_attachment_url($thumbnailId),
                'thumbnail' => wp_get_attachment_image_url($thumbnailId, 'thumbnail'),
            ];
        }

        $reviewNote = get_post_meta($postId, '_bbj_review_note', true);

        return new \WP_REST_Response([
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'author' => [
                'id' => (int) $post->post_author,
                'name' => get_the_author_meta('display_name', $post->post_author),
            ],
            'categories' => $categoryData,
            'featured_image' => $featuredImage,
            'meta_description' => get_post_meta($postId, '_bbj_meta_description', true) ?: '',
            'review_note' => $reviewNote ?: '',
        ]);
    }

    public function updatePost(\WP_REST_Request $request): \WP_REST_Response
    {
        $postId = (int) $request->get_param('id');
        $post = get_post($postId);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        // Ownership check for non-reviewers
        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        $params = $request->get_json_params();
        $updateData = ['ID' => $postId];

        if (isset($params['title'])) {
            $updateData['post_title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['content'])) {
            $updateData['post_content'] = wp_kses_post($params['content']);
        }
        if (isset($params['slug'])) {
            $updateData['post_name'] = sanitize_title($params['slug']);
        }
        if (isset($params['category_id'])) {
            $updateData['post_category'] = [(int) $params['category_id']];
        }

        $result = wp_update_post($updateData, true);

        if (is_wp_error($result)) {
            return new \WP_REST_Response([
                'error' => $result->get_error_message(),
            ], 500);
        }

        // Update featured image
        if (isset($params['featured_image_id'])) {
            if ($params['featured_image_id']) {
                set_post_thumbnail($postId, (int) $params['featured_image_id']);
            } else {
                delete_post_thumbnail($postId);
            }
        }

        // Update meta description
        if (isset($params['meta_description'])) {
            update_post_meta($postId, '_bbj_meta_description', sanitize_text_field($params['meta_description']));
        }

        return new \WP_REST_Response(['success' => true]);
    }

    public function deletePost(\WP_REST_Request $request): \WP_REST_Response
    {
        $postId = (int) $request->get_param('id');
        $post = get_post($postId);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        // Ownership check
        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        // Only allow trashing drafts and pending posts
        if (!in_array($post->post_status, ['draft', 'pending'], true)) {
            return new \WP_REST_Response(['error' => 'Only drafts and pending posts can be trashed'], 400);
        }

        wp_trash_post($postId);

        return new \WP_REST_Response(['success' => true]);
    }

    public function changeStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        $postId = (int) $request->get_param('id');
        $post = get_post($postId);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        // Ownership check for non-reviewers
        if (!$this->canReview() && (int) $post->post_author !== get_current_user_id()) {
            return new \WP_REST_Response(['error' => 'Not authorized'], 403);
        }

        $params = $request->get_json_params();
        $newStatus = sanitize_text_field($params['status'] ?? '');

        if (!in_array($newStatus, ['pending_review', 'publish'], true)) {
            return new \WP_REST_Response(['error' => 'Invalid status. Use pending_review or publish.'], 400);
        }

        // Publishing requires blog_publishing or blog_review permission
        if ($newStatus === 'publish' && !$this->canPublish()) {
            return new \WP_REST_Response(['error' => 'You do not have permission to publish posts.'], 403);
        }

        // Map pending_review to WP's pending status
        $wpStatus = $newStatus === 'pending_review' ? 'pending' : 'publish';

        wp_update_post([
            'ID' => $postId,
            'post_status' => $wpStatus,
        ]);

        // Send email on pending_review
        if ($newStatus === 'pending_review') {
            $this->notifyPendingReview($post);
        }

        // Trigger revalidation on publish
        if ($newStatus === 'publish') {
            $freshPost = get_post($postId);
            \BigBrotherJunkies\Data\Utils\Revalidation::revalidatePost($freshPost->post_name);
        }

        return new \WP_REST_Response(['success' => true, 'status' => $wpStatus]);
    }

    // --- Media ---

    public function uploadMedia(\WP_REST_Request $request): \WP_REST_Response
    {
        if (empty($_FILES['file'])) {
            return new \WP_REST_Response(['error' => 'No file uploaded'], 400);
        }

        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $attachmentId = media_handle_upload('file', 0);

        if (is_wp_error($attachmentId)) {
            return new \WP_REST_Response([
                'error' => $attachmentId->get_error_message(),
            ], 500);
        }

        return new \WP_REST_Response([
            'id' => $attachmentId,
            'url' => wp_get_attachment_url($attachmentId),
            'thumbnail' => wp_get_attachment_image_url($attachmentId, 'thumbnail'),
        ], 201);
    }

    // --- Categories ---

    public function getCategories(\WP_REST_Request $request): \WP_REST_Response
    {
        $currentSeasonOption = get_option('bbj_v2_current_season', '');

        // Get top-level categories (seasons) — those with parent=0 in "Big Brother" taxonomy
        // Big Brother categories are standard WP categories
        $parentCategories = get_categories([
            'taxonomy' => 'category',
            'parent' => 0,
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'DESC',
        ]);

        $tree = [];
        foreach ($parentCategories as $parent) {
            $children = get_categories([
                'taxonomy' => 'category',
                'parent' => $parent->term_id,
                'hide_empty' => false,
                'orderby' => 'name',
                'order' => 'ASC',
            ]);

            $childData = array_map(function ($child) {
                return [
                    'id' => $child->term_id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                ];
            }, $children);

            $isCurrent = false;
            if ($currentSeasonOption) {
                $isCurrent = $parent->slug === $currentSeasonOption
                    || $parent->name === $currentSeasonOption
                    || (string) $parent->term_id === (string) $currentSeasonOption;
            }

            $tree[] = [
                'id' => $parent->term_id,
                'name' => $parent->name,
                'slug' => $parent->slug,
                'is_current' => $isCurrent,
                'subcategories' => $childData,
            ];
        }

        return new \WP_REST_Response($tree);
    }

    // --- Review ---

    public function getReviewQueue(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset = ($page - 1) * $perPage;

        $query = new \WP_Query([
            'post_type' => 'post',
            'post_status' => 'pending',
            'posts_per_page' => $perPage,
            'offset' => $offset,
            'orderby' => 'date',
            'order' => 'ASC',
        ]);

        $posts = array_map([$this, 'formatPostListItem'], $query->posts);

        return new \WP_REST_Response([
            'items' => $posts,
            'pagination' => [
                'total' => $query->found_posts,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($query->found_posts / $perPage),
            ],
        ]);
    }

    public function reviewPost(\WP_REST_Request $request): \WP_REST_Response
    {
        $postId = (int) $request->get_param('id');
        $post = get_post($postId);

        if (!$post || $post->post_type !== 'post') {
            return new \WP_REST_Response(['error' => 'Post not found'], 404);
        }

        if ($post->post_status !== 'pending') {
            return new \WP_REST_Response(['error' => 'Post is not pending review'], 400);
        }

        $params = $request->get_json_params();
        $action = sanitize_text_field($params['action'] ?? '');
        $note = sanitize_text_field($params['note'] ?? '');

        if (!in_array($action, ['approve', 'reject'], true)) {
            return new \WP_REST_Response(['error' => 'Invalid action. Use approve or reject.'], 400);
        }

        $authorEmail = get_the_author_meta('user_email', $post->post_author);
        $authorName = get_the_author_meta('display_name', $post->post_author);

        if ($action === 'approve') {
            wp_update_post([
                'ID' => $postId,
                'post_status' => 'publish',
            ]);

            // Clear any review notes
            delete_post_meta($postId, '_bbj_review_note');

            // Revalidate
            $freshPost = get_post($postId);
            \BigBrotherJunkies\Data\Utils\Revalidation::revalidatePost($freshPost->post_name);

            // Notify author
            if ($authorEmail) {
                wp_mail(
                    $authorEmail,
                    'Your post has been approved: ' . $post->post_title,
                    "Hi {$authorName},\n\nYour post \"{$post->post_title}\" has been approved and published on Big Brother Junkies.\n\n"
                        . ($note ? "Reviewer note: {$note}\n\n" : '')
                        . "View it here: " . get_permalink($postId) . "\n"
                );
            }

            return new \WP_REST_Response(['success' => true, 'status' => 'publish']);
        }

        // Reject: set back to draft, save note
        wp_update_post([
            'ID' => $postId,
            'post_status' => 'draft',
        ]);

        if ($note) {
            update_post_meta($postId, '_bbj_review_note', $note);
        }

        // Notify author
        if ($authorEmail) {
            wp_mail(
                $authorEmail,
                'Your post needs revision: ' . $post->post_title,
                "Hi {$authorName},\n\nYour post \"{$post->post_title}\" has been sent back for revision.\n\n"
                    . ($note ? "Reviewer note: {$note}\n\n" : '')
                    . "Please update your post and resubmit for review.\n"
            );
        }

        return new \WP_REST_Response(['success' => true, 'status' => 'draft']);
    }

    // --- Helpers ---

    private function formatPostListItem(\WP_Post $post): array
    {
        $thumbnailId = get_post_thumbnail_id($post->ID);

        return [
            'id' => $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'author' => [
                'id' => (int) $post->post_author,
                'name' => get_the_author_meta('display_name', $post->post_author),
            ],
            'featured_image' => $thumbnailId
                ? wp_get_attachment_image_url($thumbnailId, 'thumbnail')
                : null,
            'excerpt' => wp_trim_words(wp_strip_all_tags($post->post_content), 25),
        ];
    }

    private function notifyPendingReview(\WP_Post $post): void
    {
        $adminEmail = get_option('admin_email');
        $authorName = get_the_author_meta('display_name', $post->post_author);

        if ($adminEmail) {
            wp_mail(
                $adminEmail,
                'Post submitted for review: ' . $post->post_title,
                "A post has been submitted for review on Big Brother Junkies.\n\n"
                    . "Title: {$post->post_title}\n"
                    . "Author: {$authorName}\n\n"
                    . "Please review it in the admin dashboard.\n"
            );
        }
    }
}
