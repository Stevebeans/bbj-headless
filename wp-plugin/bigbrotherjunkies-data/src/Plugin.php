<?php

namespace BigBrotherJunkies\Data;

use BigBrotherJunkies\Data\Admin\AdminLoader;
use BigBrotherJunkies\Data\Admin\MetaBoxes\AdSettingsMetaBox;
use BigBrotherJunkies\Data\Admin\MetaBoxes\PostSettingsMetaBox;
use BigBrotherJunkies\Data\Admin\Pages\AdsListPage;
use BigBrotherJunkies\Data\Admin\Pages\AdEditPage;
use BigBrotherJunkies\Data\Admin\Pages\SlotsPage;
use BigBrotherJunkies\Data\Admin\Pages\SettingsPage;
use BigBrotherJunkies\Data\Admin\Pages\DevToolsPage;
use BigBrotherJunkies\Data\Admin\Pages\ApiSettingsPage;
use BigBrotherJunkies\Data\Admin\Pages\ImportPage;
use BigBrotherJunkies\Data\Ads\AdManager;
use BigBrotherJunkies\Data\Ads\ContentInserter;
use BigBrotherJunkies\Data\Api\AdRoutes;
use BigBrotherJunkies\Data\Api\SpoilerBarRoutes;
use BigBrotherJunkies\Data\Api\SearchRoutes;
use BigBrotherJunkies\Data\Api\HomeRoutes;
use BigBrotherJunkies\Data\Api\CommentRoutes;
use BigBrotherJunkies\Data\Api\ReactionRoutes;
use BigBrotherJunkies\Data\Api\SessionRoutes;
use BigBrotherJunkies\Data\Api\UserProfileRoutes;
use BigBrotherJunkies\Data\Api\AdminRoutes;
use BigBrotherJunkies\Data\Api\AuthRoutes;
use BigBrotherJunkies\Data\Api\PlayerRoutes;
use BigBrotherJunkies\Data\Api\SeasonRoutes;
use BigBrotherJunkies\Data\Api\ContactRoutes;
use BigBrotherJunkies\Data\Api\PlayerPhotoRoutes;
use BigBrotherJunkies\Data\Api\ImportRoutes;
use BigBrotherJunkies\Data\Api\NotificationRoutes;
use BigBrotherJunkies\Data\Api\SubscriptionRoutes;
use BigBrotherJunkies\Data\Api\FeedUpdateRoutes;
use BigBrotherJunkies\Data\Api\BillingRoutes;
use BigBrotherJunkies\Data\Api\BugReportRoutes;
use BigBrotherJunkies\Data\Api\AnalyticsRoutes;
use BigBrotherJunkies\Data\Auth\AuthManager;
use BigBrotherJunkies\Data\Admin\Pages\SocialSettingsPage;
use BigBrotherJunkies\Data\Hooks\HeaderFooterCode;
use BigBrotherJunkies\Data\Comments\CommentMigrator;
use BigBrotherJunkies\Data\Comments\MediaRoutes;
use BigBrotherJunkies\Data\Api\AvatarRoutes;
use BigBrotherJunkies\Data\Api\SettingsRoutes;
use BigBrotherJunkies\Data\Comments\AvatarUploader;
use BigBrotherJunkies\Data\Cron\NotificationCleanup;

/**
 * Main plugin class
 */
class Plugin
{
    /**
     * Singleton instance
     */
    private static ?Plugin $instance = null;

    /**
     * Admin pages
     */
    private array $adminPages = [];

    /**
     * Auth routes instance (kept to prevent garbage collection)
     */
    private ?AuthRoutes $authRoutes = null;

    /**
     * Get singleton instance
     */
    public static function getInstance(): Plugin
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor for singleton
     */
    private function __construct()
    {
        // Private constructor
    }

    /**
     * Initialize the plugin
     */
    public function init(): void
    {
        // Handle CORS for local development
        $this->initCors();

        // Expose comment_count on WP REST API posts
        $this->registerPostRestFields();

        // Initialize Ad Manager
        $this->initAdManager();

        // Initialize Auth (login/registration)
        $this->initAuth();

        // Initialize REST API routes
        $this->initApiRoutes();

        // Initialize avatar system hooks
        $this->initAvatarHooks();

        // Initialize cron jobs
        $this->initCronJobs();

        // Load admin functionality
        if (is_admin()) {
            $this->initAdmin();
        }

        // Load frontend functionality
        $this->initFrontend();

        // Load theme integration functions
        $this->loadThemeFunctions();
    }

    /**
     * Initialize CORS headers for local development
     */
    private function initCors(): void
    {
        // Allow localhost:3000 for local Next.js development
        add_action('rest_api_init', function () {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

            // Add CORS headers just before response is served
            add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
                $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
                $allowed_origins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:3010',
                    'http://localhost:3011',
                    'http://localhost:3012',
                    'https://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'https://bigbrotherjunkies.com',
                    'https://www.bigbrotherjunkies.com',
                    'https://staging.bigbrotherjunkies.com',
                    'https://bbj-next.vercel.app',
                ];

                if (in_array($origin, $allowed_origins, true)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Access-Control-Allow-Credentials: true');
                }

                return $served;
            }, 10, 4);
        }, 15);

        // Handle CORS for all REST API requests (including errors)
        add_action('init', function () {
            // Only apply to REST API requests
            $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
            if (strpos($request_uri, '/wp-json/') === false && strpos($request_uri, '?rest_route=') === false) {
                return;
            }

            $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
            $allowed_origins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3010',
                'http://localhost:3011',
                'http://localhost:3012',
                'https://localhost:3000',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'https://bigbrotherjunkies.com',
                'https://www.bigbrotherjunkies.com',
                'https://staging.bigbrotherjunkies.com',
                'https://bbj-next.vercel.app',
            ];

            if (in_array($origin, $allowed_origins, true)) {
                // Handle preflight immediately
                if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
                    header('Access-Control-Allow-Credentials: true');
                    header('Access-Control-Max-Age: 86400');
                    status_header(200);
                    exit;
                }

                // Set headers immediately for non-OPTIONS requests too
                header('Access-Control-Allow-Origin: ' . $origin);
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
                header('Access-Control-Allow-Credentials: true');
            }
        }, 1);
    }

    /**
     * Register extra fields on the WP REST API posts endpoint
     */
    private function registerPostRestFields(): void
    {
        add_action('rest_api_init', function () {
            register_rest_field('post', 'comment_count', [
                'get_callback' => function ($post) {
                    return (int) get_post_field('comment_count', $post['id']);
                },
                'schema' => [
                    'description' => 'Number of comments on the post',
                    'type' => 'integer',
                    'context' => ['view'],
                ],
            ]);
        });
    }

    /**
     * Initialize cron jobs
     */
    private function initCronJobs(): void
    {
        $notificationCleanup = new NotificationCleanup();
        $notificationCleanup->init();
    }

    /**
     * Initialize avatar system hooks
     * Hooks into WordPress get_avatar_url to use BBJ avatar table first
     */
    private function initAvatarHooks(): void
    {
        add_filter('get_avatar_url', function ($url, $id_or_email, $args) {
            // Prevent infinite recursion
            static $processing = [];

            // Get user ID from various input types
            $userId = 0;
            if (is_numeric($id_or_email)) {
                $userId = (int) $id_or_email;
            } elseif (is_string($id_or_email)) {
                $user = get_user_by('email', $id_or_email);
                if ($user) {
                    $userId = $user->ID;
                }
            } elseif ($id_or_email instanceof \WP_User) {
                $userId = $id_or_email->ID;
            } elseif ($id_or_email instanceof \WP_Post) {
                $userId = (int) $id_or_email->post_author;
            } elseif ($id_or_email instanceof \WP_Comment) {
                $userId = (int) $id_or_email->user_id;
            }

            // Skip if no user ID or already processing this user (recursion guard)
            if ($userId <= 0 || isset($processing[$userId])) {
                return $url;
            }

            // Check for custom avatar (get URL and timestamp for cache-busting)
            global $wpdb;
            $table = \BigBrotherJunkies\Data\Comments\CommentSchema::table(
                \BigBrotherJunkies\Data\Comments\CommentSchema::TABLE_AVATARS
            );

            $avatar = $wpdb->get_row($wpdb->prepare(
                "SELECT file_url, uploaded_at FROM {$table} WHERE user_id = %d",
                $userId
            ));

            if ($avatar && $avatar->file_url) {
                // Add cache-buster timestamp to force browsers to reload new avatars
                $timestamp = strtotime($avatar->uploaded_at);
                return $avatar->file_url . '?v=' . $timestamp;
            }

            return $url;
        }, 999, 3); // High priority to override other avatar plugins

        // Also filter REST API user responses (for embedded post authors)
        add_filter('rest_prepare_user', function ($response, $user, $request) {
            $userId = $user->ID;

            // Get custom avatar URL
            global $wpdb;
            $table = \BigBrotherJunkies\Data\Comments\CommentSchema::table(
                \BigBrotherJunkies\Data\Comments\CommentSchema::TABLE_AVATARS
            );

            $avatar = $wpdb->get_row($wpdb->prepare(
                "SELECT file_url, uploaded_at FROM {$table} WHERE user_id = %d",
                $userId
            ));

            if ($avatar && $avatar->file_url) {
                $timestamp = strtotime($avatar->uploaded_at);
                $avatarUrl = $avatar->file_url . '?v=' . $timestamp;

                // Replace all avatar_urls sizes with our custom avatar
                $data = $response->get_data();
                if (isset($data['avatar_urls'])) {
                    foreach ($data['avatar_urls'] as $size => $url) {
                        $data['avatar_urls'][$size] = $avatarUrl;
                    }
                    $response->set_data($data);
                }
            }

            return $response;
        }, 999, 3);
    }

    /**
     * Initialize the Auth Manager
     */
    private function initAuth(): void
    {
        AuthManager::getInstance()->init();
    }

    /**
     * Initialize REST API routes
     */
    private function initApiRoutes(): void
    {
        $adRoutes = new AdRoutes();
        $adRoutes->init();

        $spoilerBarRoutes = new SpoilerBarRoutes();
        $spoilerBarRoutes->init();

        $searchRoutes = new SearchRoutes();
        $searchRoutes->register();

        $homeRoutes = new HomeRoutes();
        $homeRoutes->register();

        // Comment system routes
        $commentRoutes = new CommentRoutes();
        $commentRoutes->register();

        // Reaction routes (emoji reactions on comments)
        $reactionRoutes = new ReactionRoutes();
        $reactionRoutes->register();

        // Session routes (online status)
        $sessionRoutes = new SessionRoutes();
        $sessionRoutes->register();

        // User profile routes (follows, stats)
        $userProfileRoutes = new UserProfileRoutes();
        $userProfileRoutes->register();

        // Admin panel routes
        $adminRoutes = new AdminRoutes();
        $adminRoutes->register();

        // Auth routes (login, register, password reset)
        $this->authRoutes = new AuthRoutes();
        $this->authRoutes->register();

        // Comment media routes (uploads, giphy)
        $mediaRoutes = new MediaRoutes();
        $mediaRoutes->register();

        // Avatar routes (upload, get, delete)
        $avatarRoutes = new AvatarRoutes();
        $avatarRoutes->register();

        // Settings routes (user profile, notifications, email, help)
        $settingsRoutes = new SettingsRoutes();
        $settingsRoutes->register();

        // Player profile routes (single player, all players)
        $playerRoutes = new PlayerRoutes();
        $playerRoutes->init();

        // Season routes (list, single, edit)
        $seasonRoutes = new SeasonRoutes();
        $seasonRoutes->init();

        // Contact form routes
        $contactRoutes = new ContactRoutes();
        $contactRoutes->register();

        // Player photo routes (search, download, save)
        $playerPhotoRoutes = new PlayerPhotoRoutes();
        $playerPhotoRoutes->init();

        // Import routes (seasons, players)
        $importRoutes = new ImportRoutes();
        $importRoutes->init();

        // Notification routes (mentions, replies)
        $notificationRoutes = new NotificationRoutes();
        $notificationRoutes->register();

        // Subscription routes (post/thread subscriptions)
        $subscriptionRoutes = new SubscriptionRoutes();
        $subscriptionRoutes->register();

        // Feed update routes (create, vote, mode, social posting)
        $feedUpdateRoutes = new FeedUpdateRoutes();
        $feedUpdateRoutes->register();

        // Billing routes (subscriptions, checkout, webhooks)
        $billingRoutes = new BillingRoutes();
        $billingRoutes->register();

        // Bug report routes (submit, list, manage)
        $bugReportRoutes = new BugReportRoutes();
        $bugReportRoutes->register();

        // Analytics routes (GA4 dashboard data)
        $analyticsRoutes = new AnalyticsRoutes();
        $analyticsRoutes->register();
    }

    /**
     * Initialize the Ad Manager
     */
    private function initAdManager(): void
    {
        // This ensures the singleton is created
        AdManager::getInstance();
    }

    /**
     * Initialize admin functionality
     */
    private function initAdmin(): void
    {
        // Original BBJ Data page
        $adminLoader = new AdminLoader();
        $adminLoader->init();

        // Ad Manager pages
        $this->adminPages = [
            'ads_list' => new AdsListPage(),
            'ad_edit' => new AdEditPage(),
            'slots' => new SlotsPage(),
            'settings' => new SettingsPage(),
            'dev_tools' => new DevToolsPage(),
            'import' => new ImportPage(),
            'social_settings' => new SocialSettingsPage(),
            'api_settings' => new ApiSettingsPage(),
        ];

        // Register admin menus
        add_action('admin_menu', [$this, 'registerAdminMenus']);

        // Register page action handlers
        foreach ($this->adminPages as $page) {
            if (method_exists($page, 'handleActions')) {
                $page->handleActions();
            }
        }

        // Meta boxes
        $adMetaBox = new AdSettingsMetaBox();
        $adMetaBox->init();

        $postMetaBox = new PostSettingsMetaBox();
        $postMetaBox->init();
    }

    /**
     * Register admin menus
     */
    public function registerAdminMenus(): void
    {
        // Main Ad Manager menu
        add_menu_page(
            __('BBJ Ad Manager', 'bigbrotherjunkies-data'),
            __('BBJ Ad Manager', 'bigbrotherjunkies-data'),
            'manage_options',
            AdsListPage::MENU_SLUG,
            [$this->adminPages['ads_list'], 'render'],
            'dashicons-megaphone',
            3
        );

        // Ads submenu (same as parent)
        add_submenu_page(
            AdsListPage::MENU_SLUG,
            __('All Ads', 'bigbrotherjunkies-data'),
            __('All Ads', 'bigbrotherjunkies-data'),
            'manage_options',
            AdsListPage::MENU_SLUG,
            [$this->adminPages['ads_list'], 'render']
        );

        // Add New Ad
        add_submenu_page(
            AdsListPage::MENU_SLUG,
            __('Add New Ad', 'bigbrotherjunkies-data'),
            __('Add New', 'bigbrotherjunkies-data'),
            'manage_options',
            AdEditPage::MENU_SLUG,
            [$this->adminPages['ad_edit'], 'render']
        );

        // Slots
        add_submenu_page(
            AdsListPage::MENU_SLUG,
            __('Ad Slots', 'bigbrotherjunkies-data'),
            __('Slots', 'bigbrotherjunkies-data'),
            'manage_options',
            SlotsPage::MENU_SLUG,
            [$this->adminPages['slots'], 'render']
        );

        // Settings
        add_submenu_page(
            AdsListPage::MENU_SLUG,
            __('Ad Settings', 'bigbrotherjunkies-data'),
            __('Settings', 'bigbrotherjunkies-data'),
            'manage_options',
            SettingsPage::MENU_SLUG,
            [$this->adminPages['settings'], 'render']
        );

        // Dev Tools (submenu under BBJ Data)
        add_submenu_page(
            'bbjd-dashboard',
            __('Dev Tools', 'bigbrotherjunkies-data'),
            __('Dev Tools', 'bigbrotherjunkies-data'),
            'manage_options',
            DevToolsPage::MENU_SLUG,
            [$this->adminPages['dev_tools'], 'render']
        );

        // Data Import (submenu under BBJ Data)
        add_submenu_page(
            'bbjd-dashboard',
            __('Data Import', 'bigbrotherjunkies-data'),
            __('Data Import', 'bigbrotherjunkies-data'),
            'manage_options',
            ImportPage::MENU_SLUG,
            [$this->adminPages['import'], 'render']
        );

        // Social Settings (submenu under BBJ Data)
        add_submenu_page(
            'bbjd-dashboard',
            __('Social Settings', 'bigbrotherjunkies-data'),
            __('Social Settings', 'bigbrotherjunkies-data'),
            'manage_options',
            SocialSettingsPage::MENU_SLUG,
            [$this->adminPages['social_settings'], 'render']
        );

        // API Settings (submenu under BBJ Data)
        add_submenu_page(
            'bbjd-dashboard',
            __('API Settings', 'bigbrotherjunkies-data'),
            __('API', 'bigbrotherjunkies-data'),
            'manage_options',
            ApiSettingsPage::MENU_SLUG,
            [$this->adminPages['api_settings'], 'render']
        );
    }

    /**
     * Initialize frontend functionality
     */
    private function initFrontend(): void
    {
        // Content inserter for auto-insertion
        $contentInserter = new ContentInserter();
        $contentInserter->init();

        // Header/Footer code injection (ad network scripts)
        $headerFooterCode = new HeaderFooterCode();
        $headerFooterCode->init();
    }

    /**
     * Load theme integration functions
     */
    private function loadThemeFunctions(): void
    {
        // The functions are defined in ThemeIntegration.php and auto-loaded
        // They become globally available once the file is included via autoloader
        require_once BBJD_PATH . 'src/Hooks/ThemeIntegration.php';
    }
}
