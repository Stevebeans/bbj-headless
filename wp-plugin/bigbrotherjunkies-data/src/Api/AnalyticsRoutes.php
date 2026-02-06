<?php

namespace BigBrotherJunkies\Data\Api;

use BigBrotherJunkies\Data\Admin\Pages\ApiSettingsPage;
use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\RunReportRequest;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\FilterExpression;
use Google\Analytics\Data\V1beta\Filter;
use Google\Analytics\Data\V1beta\Filter\StringFilter;
use Google\Analytics\Data\V1beta\Filter\StringFilter\MatchType;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy;
use Google\Analytics\Data\V1beta\OrderBy\DimensionOrderBy;

/**
 * Analytics API Routes
 *
 * Queries GA4 Data API via service account and caches results in WP transients.
 * All endpoints require analytics_dashboard permission.
 */
class AnalyticsRoutes
{
    private const CACHE_TTL = 15 * MINUTE_IN_SECONDS;

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';
        $dateArgs = [
            'start_date' => [
                'required' => true,
                'type' => 'string',
                'validate_callback' => function ($param) {
                    return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $param);
                },
            ],
            'end_date' => [
                'required' => true,
                'type' => 'string',
                'validate_callback' => function ($param) {
                    return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $param);
                },
            ],
        ];

        register_rest_route($namespace, '/admin/analytics/overview', [
            'methods' => 'GET',
            'callback' => [$this, 'getOverview'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);

        register_rest_route($namespace, '/admin/analytics/pages', [
            'methods' => 'GET',
            'callback' => [$this, 'getPages'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);

        register_rest_route($namespace, '/admin/analytics/sources', [
            'methods' => 'GET',
            'callback' => [$this, 'getSources'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);

        register_rest_route($namespace, '/admin/analytics/audience', [
            'methods' => 'GET',
            'callback' => [$this, 'getAudience'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);

        register_rest_route($namespace, '/admin/analytics/adblocker', [
            'methods' => 'GET',
            'callback' => [$this, 'getAdBlocker'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);

        register_rest_route($namespace, '/admin/analytics/search-console', [
            'methods' => 'GET',
            'callback' => [$this, 'getSearchConsole'],
            'permission_callback' => [$this, 'checkAnalyticsAccess'],
            'args' => $dateArgs,
        ]);
    }

    // ========================================
    // ENDPOINT HANDLERS
    // ========================================

    /**
     * Overview: KPI cards + daily traffic chart data
     */
    public function getOverview(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->cachedReport('bbjd_ga4_overview_', $request, function ($client, $propertyId, $startDate, $endDate) {
            // KPI totals
            $kpiResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'metrics' => [
                    new Metric(['name' => 'totalUsers']),
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'averageSessionDuration']),
                    new Metric(['name' => 'bounceRate']),
                ],
            ]));

            $kpi = [
                'total_users' => 0,
                'page_views' => 0,
                'avg_session_duration' => 0,
                'bounce_rate' => 0,
            ];

            foreach ($kpiResponse->getRows() as $row) {
                $metrics = $row->getMetricValues();
                $kpi['total_users'] = (int) $metrics[0]->getValue();
                $kpi['page_views'] = (int) $metrics[1]->getValue();
                $kpi['avg_session_duration'] = round((float) $metrics[2]->getValue(), 1);
                $kpi['bounce_rate'] = round((float) $metrics[3]->getValue() * 100, 1);
            }

            // Daily chart data
            $chartResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'date'])],
                'metrics' => [
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'totalUsers']),
                ],
                'orderBys' => [
                    new OrderBy([
                        'dimension' => new DimensionOrderBy(['dimension_name' => 'date']),
                    ]),
                ],
            ]));

            $chart = [];
            foreach ($chartResponse->getRows() as $row) {
                $date = $row->getDimensionValues()[0]->getValue();
                $metrics = $row->getMetricValues();
                $chart[] = [
                    'date' => self::formatGa4Date($date),
                    'page_views' => (int) $metrics[0]->getValue(),
                    'users' => (int) $metrics[1]->getValue(),
                ];
            }

            return ['kpi' => $kpi, 'chart' => $chart];
        });
    }

    /**
     * Pages: Top pages, landing pages, content type breakdown
     */
    public function getPages(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->cachedReport('bbjd_ga4_pages_', $request, function ($client, $propertyId, $startDate, $endDate) {
            // Top pages by pageviews
            $topPagesResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'pagePath'])],
                'metrics' => [
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'averageSessionDuration']),
                ],
                'orderBys' => [
                    new OrderBy([
                        'metric' => new MetricOrderBy(['metric_name' => 'screenPageViews']),
                        'desc' => true,
                    ]),
                ],
                'limit' => 15,
            ]));

            $topPages = [];
            foreach ($topPagesResponse->getRows() as $row) {
                $topPages[] = [
                    'path' => $row->getDimensionValues()[0]->getValue(),
                    'views' => (int) $row->getMetricValues()[0]->getValue(),
                    'avg_time' => round((float) $row->getMetricValues()[1]->getValue(), 1),
                ];
            }

            // Landing pages
            $landingResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'landingPagePlusQueryString'])],
                'metrics' => [
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'bounceRate']),
                ],
                'orderBys' => [
                    new OrderBy([
                        'metric' => new MetricOrderBy(['metric_name' => 'sessions']),
                        'desc' => true,
                    ]),
                ],
                'limit' => 10,
            ]));

            $landingPages = [];
            foreach ($landingResponse->getRows() as $row) {
                $landingPages[] = [
                    'path' => $row->getDimensionValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[0]->getValue(),
                    'bounce_rate' => round((float) $row->getMetricValues()[1]->getValue() * 100, 1),
                ];
            }

            // Content type breakdown (broader query for accurate grouping)
            $allPagesResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'pagePath'])],
                'metrics' => [new Metric(['name' => 'screenPageViews'])],
                'limit' => 500,
            ]));

            $contentTypes = [
                'Blog Posts' => 0,
                'Players' => 0,
                'Seasons' => 0,
                'Feed Updates' => 0,
                'Other' => 0,
            ];
            foreach ($allPagesResponse->getRows() as $row) {
                $path = $row->getDimensionValues()[0]->getValue();
                $views = (int) $row->getMetricValues()[0]->getValue();
                if (strpos($path, '/posts/') === 0) {
                    $contentTypes['Blog Posts'] += $views;
                } elseif (strpos($path, '/players/') === 0 || $path === '/players') {
                    $contentTypes['Players'] += $views;
                } elseif (strpos($path, '/seasons/') === 0 || $path === '/seasons') {
                    $contentTypes['Seasons'] += $views;
                } elseif (strpos($path, '/feed-updates') === 0) {
                    $contentTypes['Feed Updates'] += $views;
                } else {
                    $contentTypes['Other'] += $views;
                }
            }

            $contentBreakdown = [];
            foreach ($contentTypes as $type => $views) {
                $contentBreakdown[] = ['type' => $type, 'views' => $views];
            }

            return [
                'top_pages' => $topPages,
                'landing_pages' => $landingPages,
                'content_breakdown' => $contentBreakdown,
            ];
        });
    }

    /**
     * Sources: Traffic channels + top referrers
     */
    public function getSources(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->cachedReport('bbjd_ga4_sources_', $request, function ($client, $propertyId, $startDate, $endDate) {
            // Traffic channels
            $channelResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'sessionDefaultChannelGroup'])],
                'metrics' => [new Metric(['name' => 'sessions'])],
                'orderBys' => [
                    new OrderBy([
                        'metric' => new MetricOrderBy(['metric_name' => 'sessions']),
                        'desc' => true,
                    ]),
                ],
                'limit' => 10,
            ]));

            $channels = [];
            foreach ($channelResponse->getRows() as $row) {
                $channels[] = [
                    'channel' => $row->getDimensionValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }

            // Top referrers
            $referrerResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'sessionSource'])],
                'metrics' => [
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'totalUsers']),
                ],
                'orderBys' => [
                    new OrderBy([
                        'metric' => new MetricOrderBy(['metric_name' => 'sessions']),
                        'desc' => true,
                    ]),
                ],
                'limit' => 15,
            ]));

            $referrers = [];
            foreach ($referrerResponse->getRows() as $row) {
                $referrers[] = [
                    'source' => $row->getDimensionValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[0]->getValue(),
                    'users' => (int) $row->getMetricValues()[1]->getValue(),
                ];
            }

            return ['channels' => $channels, 'referrers' => $referrers];
        });
    }

    /**
     * Audience: Device breakdown, peak hours, geography
     */
    public function getAudience(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->cachedReport('bbjd_ga4_audience_', $request, function ($client, $propertyId, $startDate, $endDate) {
            // Device breakdown
            $deviceResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'deviceCategory'])],
                'metrics' => [new Metric(['name' => 'sessions'])],
            ]));

            $devices = [];
            foreach ($deviceResponse->getRows() as $row) {
                $devices[] = [
                    'device' => $row->getDimensionValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }

            // Peak hours
            $hourResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'hour'])],
                'metrics' => [new Metric(['name' => 'screenPageViews'])],
                'orderBys' => [
                    new OrderBy([
                        'dimension' => new DimensionOrderBy(['dimension_name' => 'hour']),
                    ]),
                ],
            ]));

            $hours = [];
            foreach ($hourResponse->getRows() as $row) {
                $utcHour = (int) $row->getDimensionValues()[0]->getValue();
                $hours[] = [
                    'hour' => ($utcHour - 5 + 24) % 24, // UTC to EST
                    'page_views' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }
            usort($hours, fn($a, $b) => $a['hour'] - $b['hour']);

            // Geography
            $geoResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'country'])],
                'metrics' => [
                    new Metric(['name' => 'totalUsers']),
                    new Metric(['name' => 'sessions']),
                ],
                'orderBys' => [
                    new OrderBy([
                        'metric' => new MetricOrderBy(['metric_name' => 'totalUsers']),
                        'desc' => true,
                    ]),
                ],
                'limit' => 10,
            ]));

            $countries = [];
            foreach ($geoResponse->getRows() as $row) {
                $countries[] = [
                    'country' => $row->getDimensionValues()[0]->getValue(),
                    'users' => (int) $row->getMetricValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[1]->getValue(),
                ];
            }

            return [
                'devices' => $devices,
                'peak_hours' => $hours,
                'countries' => $countries,
            ];
        });
    }

    /**
     * Ad Blocker: event count data for ad_blocker_detected custom event
     */
    public function getAdBlocker(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->cachedReport('bbjd_ga4_adblocker_', $request, function ($client, $propertyId, $startDate, $endDate) {
            // Total sessions for the period (to calculate %)
            $totalResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'metrics' => [new Metric(['name' => 'sessions'])],
            ]));

            $totalSessions = 0;
            foreach ($totalResponse->getRows() as $row) {
                $totalSessions = (int) $row->getMetricValues()[0]->getValue();
            }

            // Ad blocker events with daily breakdown
            $adBlockResponse = $client->runReport($this->buildRequest([
                'property' => $propertyId,
                'dateRanges' => [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])],
                'dimensions' => [new Dimension(['name' => 'date'])],
                'metrics' => [new Metric(['name' => 'eventCount'])],
                'dimensionFilter' => new FilterExpression([
                    'filter' => new Filter([
                        'field_name' => 'eventName',
                        'string_filter' => new StringFilter([
                            'match_type' => MatchType::EXACT,
                            'value' => 'ad_blocker_detected',
                        ]),
                    ]),
                ]),
                'orderBys' => [
                    new OrderBy([
                        'dimension' => new DimensionOrderBy(['dimension_name' => 'date']),
                    ]),
                ],
            ]));

            $totalAdBlockEvents = 0;
            $daily = [];
            foreach ($adBlockResponse->getRows() as $row) {
                $date = $row->getDimensionValues()[0]->getValue();
                $count = (int) $row->getMetricValues()[0]->getValue();
                $totalAdBlockEvents += $count;
                $daily[] = [
                    'date' => self::formatGa4Date($date),
                    'count' => $count,
                ];
            }

            $percentage = $totalSessions > 0
                ? round(($totalAdBlockEvents / $totalSessions) * 100, 1)
                : 0;

            return [
                'total_events' => $totalAdBlockEvents,
                'total_sessions' => $totalSessions,
                'percentage' => $percentage,
                'daily' => $daily,
            ];
        });
    }

    /**
     * Search Console: Top keywords and top pages from Google Search
     */
    public function getSearchConsole(\WP_REST_Request $request): \WP_REST_Response
    {
        $startDate = $request->get_param('start_date');
        $endDate = $request->get_param('end_date');

        $cacheKey = 'bbjd_gsc_' . md5($startDate . $endDate);
        $cached = get_transient($cacheKey);
        if ($cached !== false) {
            return new \WP_REST_Response($cached, 200);
        }

        $accessToken = $this->getSearchConsoleToken();
        if (is_wp_error($accessToken)) {
            return new \WP_REST_Response(['error' => $accessToken->get_error_message()], 500);
        }

        $siteUrl = 'sc-domain:bigbrotherjunkies.com';
        $encodedSite = urlencode($siteUrl);
        $apiBase = "https://www.googleapis.com/webmasters/v3/sites/{$encodedSite}/searchAnalytics/query";

        try {
            // Top keywords
            $keywordsBody = wp_json_encode([
                'startDate' => $startDate,
                'endDate' => $endDate,
                'dimensions' => ['query'],
                'rowLimit' => 25,
                'searchType' => 'web',
            ]);

            $keywordsResponse = wp_remote_post($apiBase, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'body' => $keywordsBody,
                'timeout' => 30,
            ]);

            if (is_wp_error($keywordsResponse)) {
                throw new \Exception('Keywords request failed: ' . $keywordsResponse->get_error_message());
            }

            $keywordsData = json_decode(wp_remote_retrieve_body($keywordsResponse), true);
            $httpCode = wp_remote_retrieve_response_code($keywordsResponse);
            if ($httpCode !== 200) {
                $errMsg = $keywordsData['error']['message'] ?? "HTTP {$httpCode}";
                throw new \Exception('Search Console API error: ' . $errMsg);
            }

            $keywords = [];
            foreach (($keywordsData['rows'] ?? []) as $row) {
                $keywords[] = [
                    'query' => $row['keys'][0],
                    'clicks' => (int) $row['clicks'],
                    'impressions' => (int) $row['impressions'],
                    'ctr' => round($row['ctr'] * 100, 1),
                    'position' => round($row['position'], 1),
                ];
            }

            // Top pages by search performance
            $pagesBody = wp_json_encode([
                'startDate' => $startDate,
                'endDate' => $endDate,
                'dimensions' => ['page'],
                'rowLimit' => 15,
                'searchType' => 'web',
            ]);

            $pagesResponse = wp_remote_post($apiBase, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'body' => $pagesBody,
                'timeout' => 30,
            ]);

            if (is_wp_error($pagesResponse)) {
                throw new \Exception('Pages request failed: ' . $pagesResponse->get_error_message());
            }

            $pagesData = json_decode(wp_remote_retrieve_body($pagesResponse), true);

            $searchPages = [];
            foreach (($pagesData['rows'] ?? []) as $row) {
                // Strip domain to show just the path
                $fullUrl = $row['keys'][0];
                $path = preg_replace('#^https?://(www\.)?bigbrotherjunkies\.com#', '', $fullUrl);
                if ($path === '' || $path === '/') $path = '/';

                $searchPages[] = [
                    'page' => $path,
                    'clicks' => (int) $row['clicks'],
                    'impressions' => (int) $row['impressions'],
                    'ctr' => round($row['ctr'] * 100, 1),
                    'position' => round($row['position'], 1),
                ];
            }

            $data = [
                'keywords' => $keywords,
                'pages' => $searchPages,
            ];

            set_transient($cacheKey, $data, self::CACHE_TTL);
            return new \WP_REST_Response($data, 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response(['error' => $e->getMessage()], 500);
        }
    }

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Wrapper that handles caching, client init, and error handling for all endpoints
     */
    private function cachedReport(string $cachePrefix, \WP_REST_Request $request, callable $queryFn): \WP_REST_Response
    {
        $startDate = $request->get_param('start_date');
        $endDate = $request->get_param('end_date');

        $cacheKey = $cachePrefix . md5($startDate . $endDate);
        $cached = get_transient($cacheKey);
        if ($cached !== false) {
            return new \WP_REST_Response($cached, 200);
        }

        $client = $this->getClient();
        if (is_wp_error($client)) {
            return new \WP_REST_Response(['error' => $client->get_error_message()], 500);
        }

        try {
            $data = $queryFn($client, $this->getPropertyId(), $startDate, $endDate);
            set_transient($cacheKey, $data, self::CACHE_TTL);
            return new \WP_REST_Response($data, 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Build a RunReportRequest from an array of options
     */
    private function buildRequest(array $options): RunReportRequest
    {
        $request = (new RunReportRequest())
            ->setProperty($options['property'])
            ->setDateRanges($options['dateRanges'])
            ->setMetrics($options['metrics']);

        if (!empty($options['dimensions'])) {
            $request->setDimensions($options['dimensions']);
        }
        if (!empty($options['orderBys'])) {
            $request->setOrderBys($options['orderBys']);
        }
        if (!empty($options['limit'])) {
            $request->setLimit($options['limit']);
        }
        if (!empty($options['dimensionFilter'])) {
            $request->setDimensionFilter($options['dimensionFilter']);
        }

        return $request;
    }

    /**
     * Convert GA4 date format (YYYYMMDD) to ISO format (YYYY-MM-DD)
     */
    private static function formatGa4Date(string $date): string
    {
        return substr($date, 0, 4) . '-' . substr($date, 4, 2) . '-' . substr($date, 6, 2);
    }

    /**
     * Get GA4 property ID from settings
     */
    private function getPropertyId(): string
    {
        $settings = ApiSettingsPage::getSettings();
        return $settings['ga4_property_id'];
    }

    /**
     * Create and return a BetaAnalyticsDataClient instance
     *
     * @return BetaAnalyticsDataClient|\WP_Error
     */
    private function getClient()
    {
        $settings = ApiSettingsPage::getSettings();

        if (empty($settings['ga4_property_id'])) {
            return new \WP_Error('ga4_not_configured', 'GA4 Property ID is not configured.');
        }

        if (empty($settings['ga4_service_account_json'])) {
            return new \WP_Error('ga4_not_configured', 'GA4 Service Account JSON is not configured.');
        }

        $credentials = json_decode($settings['ga4_service_account_json'], true);
        if (!$credentials) {
            return new \WP_Error('ga4_invalid_credentials', 'GA4 Service Account JSON is invalid.');
        }

        try {
            return new BetaAnalyticsDataClient([
                'credentials' => $credentials,
                'transport' => 'rest', // No gRPC on Cloudways
            ]);
        } catch (\Exception $e) {
            return new \WP_Error('ga4_client_error', 'Failed to create GA4 client: ' . $e->getMessage());
        }
    }

    /**
     * Get an OAuth2 access token for Search Console API using the service account
     *
     * @return string|\WP_Error
     */
    private function getSearchConsoleToken()
    {
        $settings = ApiSettingsPage::getSettings();

        if (empty($settings['ga4_service_account_json'])) {
            return new \WP_Error('gsc_not_configured', 'Service Account JSON is not configured.');
        }

        $credentials = json_decode($settings['ga4_service_account_json'], true);
        if (!$credentials) {
            return new \WP_Error('gsc_invalid_credentials', 'Service Account JSON is invalid.');
        }

        try {
            $creds = new \Google\Auth\Credentials\ServiceAccountCredentials(
                ['https://www.googleapis.com/auth/webmasters.readonly'],
                $credentials
            );
            $token = $creds->fetchAuthToken();
            return $token['access_token'] ?? new \WP_Error('gsc_token_error', 'Failed to obtain access token.');
        } catch (\Exception $e) {
            return new \WP_Error('gsc_auth_error', 'Auth failed: ' . $e->getMessage());
        }
    }

    /**
     * Permission check: analytics_dashboard
     */
    public function checkAnalyticsAccess(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $permissions = get_option('bbj_admin_permissions', AdminRoutes::DEFAULT_PERMISSIONS);

        if (!isset($permissions['analytics_dashboard'])) {
            // Fall back: allow administrators
            $user = wp_get_current_user();
            return in_array('administrator', $user->roles, true);
        }

        $user = wp_get_current_user();
        return !empty(array_intersect($user->roles, $permissions['analytics_dashboard']['roles']));
    }
}
