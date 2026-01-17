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
use BigBrotherJunkies\Data\Auth\AuthManager;
use BigBrotherJunkies\Data\Hooks\HeaderFooterCode;
use BigBrotherJunkies\Data\Comments\CommentMigrator;
use BigBrotherJunkies\Data\Comments\MediaRoutes;

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

        // Initialize Ad Manager
        $this->initAdManager();

        // Initialize Auth (login/registration)
        $this->initAuth();

        // Initialize REST API routes
        $this->initApiRoutes();

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
            add_filter('rest_pre_serve_request', function ($value) {
                $origin = get_http_origin();
                $allowed_origins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'https://bigbrotherjunkies.com',
                    'https://www.bigbrotherjunkies.com',
                    'https://bbj-next.vercel.app',
                ];

                if ($origin && in_array($origin, $allowed_origins, true)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
                    header('Access-Control-Allow-Credentials: true');
                }

                return $value;
            });
        }, 15);

        // Handle preflight OPTIONS requests
        add_action('init', function () {
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
                $allowed_origins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'https://bigbrotherjunkies.com',
                    'https://www.bigbrotherjunkies.com',
                    'https://bbj-next.vercel.app',
                ];

                if (in_array($origin, $allowed_origins, true)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
                    header('Access-Control-Allow-Credentials: true');
                    header('Access-Control-Max-Age: 86400');
                    status_header(200);
                    exit;
                }
            }
        }, 1);
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

        // Dev Tools
        add_submenu_page(
            AdsListPage::MENU_SLUG,
            __('Dev Tools', 'bigbrotherjunkies-data'),
            __('Dev Tools', 'bigbrotherjunkies-data'),
            'manage_options',
            DevToolsPage::MENU_SLUG,
            [$this->adminPages['dev_tools'], 'render']
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
