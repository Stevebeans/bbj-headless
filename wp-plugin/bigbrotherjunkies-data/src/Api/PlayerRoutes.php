<?php

namespace BigBrotherJunkies\Data\Api;

use WP_REST_Request;
use WP_REST_Response;

/**
 * REST API routes for player profiles
 *
 * Used by Next.js frontend to fetch single player profile data
 */
class PlayerRoutes
{
    /**
     * API namespace
     */
    private const NAMESPACE = 'bbjd/v1';

    /**
     * Initialize the routes
     */
    public function init(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    /**
     * Register REST routes
     */
    public function registerRoutes(): void
    {
        // Get single player by slug
        register_rest_route(self::NAMESPACE, '/players/(?P<slug>[a-zA-Z0-9-]+)', [
            'methods'  => 'GET',
            'callback' => [$this, 'getPlayerBySlug'],
            'permission_callback' => '__return_true',
            'args' => [
                'slug' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_title',
                ],
            ],
        ]);

        // Get all players (for static generation)
        register_rest_route(self::NAMESPACE, '/players', [
            'methods'  => 'GET',
            'callback' => [$this, 'getAllPlayers'],
            'permission_callback' => '__return_true',
            'args' => [
                'fields' => [
                    'default' => 'full',
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'per_page' => [
                    'default' => 100,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }

    /**
     * Get single player by slug
     */
    public function getPlayerBySlug(WP_REST_Request $request): WP_REST_Response
    {
        $slug = $request->get_param('slug');

        // Find the player post by slug
        $posts = get_posts([
            'name' => $slug,
            'post_type' => 'bigbrother-players',
            'post_status' => 'publish',
            'numberposts' => 1,
        ]);

        if (empty($posts)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Player not found',
            ], 404);
        }

        $post = $posts[0];
        $playerId = $post->ID;

        // Get player data from custom table
        $player = function_exists('bbj_v2_get_player')
            ? bbj_v2_get_player($playerId)
            : null;

        if (!$player) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Player data not found',
            ], 404);
        }

        // Get all seasons this player appeared in
        $seasons = function_exists('bbj_v2_get_seasons_by_player')
            ? bbj_v2_get_seasons_by_player($playerId)
            : [];

        // Calculate career stats and awards
        $careerStats = $this->calculateCareerStats($seasons, $playerId);
        $awards = $this->detectAwards($seasons, $playerId);

        // Get profile picture
        $photoData = $this->getPhotoData($player['profile_picture'] ?? 0);

        // Get banner image if exists
        $bannerData = $this->getPhotoData($player['player_banner'] ?? 0, 'large');

        // Format seasons data
        $formattedSeasons = $this->formatSeasons($seasons, $playerId, $player);

        // Get related posts (posts mentioning this player)
        $relatedPosts = $this->getRelatedPosts($player, $playerId);

        // Get related players (from same seasons)
        $relatedPlayers = $this->getRelatedPlayers($seasons, $playerId);

        // Calculate current age
        $age = $this->calculateAge($player['date_of_birth'] ?? null);

        // Build response
        $response = [
            'success' => true,
            'player' => [
                'id' => (int) $playerId,
                'slug' => $slug,
                'name' => trim(($player['first_name'] ?? '') . ' ' . ($player['last_name'] ?? '')),
                'first_name' => $player['first_name'] ?? '',
                'last_name' => $player['last_name'] ?? '',
                'nickname' => $player['official_nickname'] ?? '',
                'display_name' => !empty($player['official_nickname'])
                    ? '"' . $player['official_nickname'] . '"'
                    : ($player['first_name'] ?? ''),
                'photo' => $photoData,
                'banner' => $bannerData,
                'permalink' => get_permalink($playerId),
                'bio' => apply_filters('the_content', $post->post_content),
                'comment_count' => (int) get_comments_number($playerId),
                'age' => $age,
                'date_of_birth' => $player['date_of_birth'] ?? null,
                'gender' => $player['player_gender'] ?? '',
                'occupation' => $player['occupation'] ?? '',
                'hometown' => $this->formatHometown($player),
                'city' => $player['locality'] ?? '',
                'state' => $player['administrative_area_level_1'] ?? '',
                'social' => [
                    'twitter' => $player['twitter'] ?? null,
                    'instagram' => $player['instagram'] ?? null,
                    'facebook' => $player['facebook'] ?? null,
                    'tiktok' => $player['tiktok'] ?? null,
                ],
                'awards' => $awards,
                'stats' => $careerStats,
                'seasons' => $formattedSeasons,
            ],
            'related_posts' => $relatedPosts,
            'related_players' => $relatedPlayers,
        ];

        return new WP_REST_Response($response, 200);
    }

    /**
     * Get all players (slugs for static generation)
     */
    public function getAllPlayers(WP_REST_Request $request): WP_REST_Response
    {
        $fields = $request->get_param('fields');
        $perPage = min($request->get_param('per_page'), 500);

        $posts = get_posts([
            'post_type' => 'bigbrother-players',
            'post_status' => 'publish',
            'numberposts' => $perPage,
            'orderby' => 'title',
            'order' => 'ASC',
        ]);

        if ($fields === 'slug') {
            // Return just slugs for static generation
            $players = array_map(function ($post) {
                return ['slug' => $post->post_name];
            }, $posts);
        } else {
            // Return basic player info
            $players = array_map(function ($post) {
                return [
                    'id' => $post->ID,
                    'slug' => $post->post_name,
                    'name' => $post->post_title,
                    'permalink' => get_permalink($post->ID),
                ];
            }, $posts);
        }

        return new WP_REST_Response([
            'success' => true,
            'players' => $players,
            'count' => count($players),
        ], 200);
    }

    /**
     * Calculate career stats from all seasons
     */
    private function calculateCareerStats(array $seasons, int $playerId): array
    {
        $totalHoh = 0;
        $totalPov = 0;
        $totalNom = 0;
        $totalVotes = 0;
        $totalDays = 0;

        foreach ($seasons as $season) {
            $totalHoh += (int) ($season['bbj_total_hoh'] ?? 0);
            $totalPov += (int) ($season['bbj_total_pov'] ?? 0);
            $totalNom += (int) ($season['bbj_total_nom'] ?? 0);
            $totalVotes += (int) ($season['bbj_votes_received'] ?? 0);

            // Calculate days in house for this season
            $daysInHouse = $this->calculateDaysInHouse($season);
            $totalDays += $daysInHouse;
        }

        return [
            'total_seasons' => count($seasons),
            'total_hoh' => $totalHoh,
            'total_pov' => $totalPov,
            'total_nom' => $totalNom,
            'total_votes' => $totalVotes,
            'total_days' => $totalDays,
        ];
    }

    /**
     * Detect awards (winner, runner-up, AFP)
     */
    private function detectAwards(array $seasons, int $playerId): array
    {
        $awards = [
            'winner' => false,
            'runner_up' => false,
            'afp' => false,
        ];

        foreach ($seasons as $season) {
            if (!empty($season['season_winner']) && (int) $season['season_winner'] === $playerId) {
                $awards['winner'] = true;
            }
            if (!empty($season['runner_up']) && (int) $season['runner_up'] === $playerId) {
                $awards['runner_up'] = true;
            }
            if (!empty($season['afp']) && (int) $season['afp'] === $playerId) {
                $awards['afp'] = true;
            }
        }

        return $awards;
    }

    /**
     * Format seasons for API response
     */
    private function formatSeasons(array $seasons, int $playerId, array $player): array
    {
        $formatted = [];

        foreach ($seasons as $season) {
            $seasonId = (int) ($season['bbj_season'] ?? 0);
            $seasonName = $season['full_name'] ?? '';
            $seasonAbbr = $season['abbreviation'] ?? '';

            // Calculate dates and days
            $startDate = !empty($season['start_date']) ? new \DateTime($season['start_date']) : null;
            $endDate = !empty($season['end_date']) ? new \DateTime($season['end_date']) : null;
            $evictedDate = $this->parseDate($season['bbj_evicted_date'] ?? null);

            $totalDays = ($startDate && $endDate) ? $endDate->diff($startDate)->days + 1 : null;
            $exitDate = $evictedDate ?: $endDate;
            $daysInHouse = ($startDate && $exitDate) ? $exitDate->diff($startDate)->days + 1 : null;

            $progressPct = ($totalDays && $daysInHouse)
                ? max(0, min(100, (int) round(($daysInHouse / $totalDays) * 100)))
                : null;

            // Calculate age during season
            $ageDuring = null;
            if (!empty($player['date_of_birth']) && $startDate) {
                $dob = new \DateTime($player['date_of_birth']);
                $ageDuring = $dob->diff($startDate)->y;
            }

            // Determine result
            $result = $this->getSeasonResult($season, $playerId);

            // Get current status
            $status = $this->getPlayerStatus($season);

            // Get season slug from post
            $seasonPost = get_post($seasonId);
            $seasonSlug = $seasonPost ? $seasonPost->post_name : null;

            $formatted[] = [
                'season_id' => $seasonId,
                'season_slug' => $seasonSlug,
                'season_name' => $seasonName,
                'season_abbr' => $seasonAbbr,
                'season_permalink' => get_permalink($seasonId),
                'hoh' => (int) ($season['bbj_total_hoh'] ?? 0),
                'pov' => (int) ($season['bbj_total_pov'] ?? 0),
                'nom' => (int) ($season['bbj_total_nom'] ?? 0),
                'votes_received' => (int) ($season['bbj_votes_received'] ?? 0),
                'total_days' => $totalDays,
                'days_in_house' => $daysInHouse,
                'progress_pct' => $progressPct,
                'age_during' => $ageDuring,
                'result' => $result,
                'status' => $status,
                'evicted_date' => $evictedDate ? $evictedDate->format('Y-m-d') : null,
            ];
        }

        return $formatted;
    }

    /**
     * Get season result for player
     */
    private function getSeasonResult(array $season, int $playerId): string
    {
        if (!empty($season['season_winner']) && (int) $season['season_winner'] === $playerId) {
            return 'Winner';
        }
        if (!empty($season['runner_up']) && (int) $season['runner_up'] === $playerId) {
            return 'Runner Up';
        }
        if (!empty($season['afp']) && (int) $season['afp'] === $playerId) {
            return 'AFP';
        }
        if (!empty($season['current_jury'])) {
            return 'Jury';
        }
        if (!empty($season['current_evicted'])) {
            return 'Evicted';
        }
        return 'Active';
    }

    /**
     * Get player status in a season
     */
    private function getPlayerStatus(array $season): string
    {
        if (!empty($season['current_hoh'])) return 'hoh';
        if (!empty($season['current_pov'])) return 'pov';
        if (!empty($season['current_evicted'])) return 'evicted';
        if (!empty($season['current_jury'])) return 'jury';
        if (!empty($season['current_nom'])) return 'nom';
        if (!empty($season['current_havenot'])) return 'havenot';
        if (!empty($season['current_safe'])) return 'safe';
        return 'active';
    }

    /**
     * Get related posts mentioning this player
     */
    private function getRelatedPosts(array $player, int $playerId): array
    {
        $playerName = trim(($player['first_name'] ?? '') . ' ' . ($player['last_name'] ?? ''));

        if (empty($playerName)) {
            return [];
        }

        // Search for posts containing the player's name
        $posts = get_posts([
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 5,
            's' => $playerName,
            'orderby' => 'date',
            'order' => 'DESC',
        ]);

        $formatted = [];
        foreach ($posts as $post) {
            $formatted[] = [
                'id' => $post->ID,
                'slug' => $post->post_name,
                'title' => $post->post_title,
                'excerpt' => wp_trim_words($post->post_excerpt ?: $post->post_content, 20),
                'date' => $post->post_date,
                'permalink' => get_permalink($post->ID),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'medium') ?: null,
            ];
        }

        return $formatted;
    }

    /**
     * Get related players from same seasons, grouped by season
     */
    private function getRelatedPlayers(array $seasons, int $currentPlayerId): array
    {
        if (empty($seasons)) {
            return [];
        }

        $result = [];

        foreach ($seasons as $season) {
            $seasonId = (int) ($season['bbj_season'] ?? 0);
            $seasonName = $season['full_name'] ?? '';
            $seasonAbbr = $season['abbreviation'] ?? '';

            if (!$seasonId) {
                continue;
            }

            // Get players from this season
            $seasonPlayers = function_exists('bbj_v2_get_season_players')
                ? bbj_v2_get_season_players($seasonId, 'bbj_v2_spoiler_bar')
                : [];

            $players = [];

            foreach ($seasonPlayers as $player) {
                $playerId = (int) ($player['bbj_player'] ?? $player['id'] ?? 0);

                // Skip current player
                if ($playerId === $currentPlayerId) {
                    continue;
                }

                $players[] = [
                    'id' => $playerId,
                    'name' => trim(($player['first_name'] ?? '') . ' ' . ($player['last_name'] ?? '')),
                    'nickname' => $player['official_nickname'] ?? '',
                    'photo' => $player['profile_picture_url'] ?? '',
                    'permalink' => $player['permalink'] ?? get_permalink($playerId),
                    'status' => $this->getPlayerStatus($player),
                ];
            }

            $result[] = [
                'season_id' => $seasonId,
                'season_name' => $seasonName,
                'season_abbr' => $seasonAbbr,
                'players' => $players,
            ];
        }

        return $result;
    }

    /**
     * Get photo data with dimensions
     */
    private function getPhotoData(int $attachmentId, string $size = 'bbj_v2_profile_image'): ?array
    {
        if (!$attachmentId) {
            return null;
        }

        $imageData = wp_get_attachment_image_src($attachmentId, $size);

        if (!$imageData) {
            return null;
        }

        return [
            'url' => $imageData[0],
            'width' => (int) $imageData[1],
            'height' => (int) $imageData[2],
        ];
    }

    /**
     * Format hometown from city and state
     */
    private function formatHometown(array $player): string
    {
        $city = $player['locality'] ?? '';
        $state = $player['administrative_area_level_1'] ?? '';

        if ($city && $state) {
            return "$city, $state";
        }

        return $city ?: $state ?: '';
    }

    /**
     * Calculate current age from date of birth
     */
    private function calculateAge(?string $dob): ?int
    {
        if (!$dob || $dob === '0000-00-00') {
            return null;
        }

        try {
            $birthDate = new \DateTime($dob);
            $today = new \DateTime();
            return $birthDate->diff($today)->y;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Parse date string to DateTime
     */
    private function parseDate(?string $dateStr): ?\DateTime
    {
        if (!$dateStr || $dateStr === '0000-00-00') {
            return null;
        }

        try {
            return new \DateTime($dateStr);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Calculate days in house for a season
     */
    private function calculateDaysInHouse(array $season): int
    {
        $startDate = !empty($season['start_date']) ? new \DateTime($season['start_date']) : null;
        $endDate = !empty($season['end_date']) ? new \DateTime($season['end_date']) : null;
        $evictedDate = $this->parseDate($season['bbj_evicted_date'] ?? null);

        if (!$startDate) {
            return 0;
        }

        $exitDate = $evictedDate ?: $endDate;

        if (!$exitDate) {
            return 0;
        }

        return $exitDate->diff($startDate)->days + 1;
    }
}
