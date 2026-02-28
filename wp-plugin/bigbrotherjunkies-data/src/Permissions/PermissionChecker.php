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
