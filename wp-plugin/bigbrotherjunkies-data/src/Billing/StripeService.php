<?php

namespace BigBrotherJunkies\Data\Billing;

/**
 * Stripe payment service
 * Handles checkout sessions, subscriptions, and webhooks
 */
class StripeService
{
    private string $secretKey;
    private string $publishableKey;
    private string $webhookSecret;
    private bool $testMode;

    /**
     * Plan configuration
     */
    private const PLANS = [
        'monthly' => [
            'name' => 'BBJ Supporter Monthly',
            'amount' => 695, // $6.95 in cents
            'interval' => 'month',
            'interval_count' => 1,
            'role' => 'supporter',
        ],
        'annual' => [
            'name' => 'BBJ Season Pass',
            'amount' => 3500, // $35.00 in cents
            'interval' => 'year',
            'interval_count' => 1,
            'role' => 'supporter',
        ],
        'lifetime' => [
            'name' => 'BBJ Lifetime',
            'amount' => 9900, // $99.00 in cents
            'interval' => null, // One-time
            'role' => 'lifetime',
        ],
    ];

    public function __construct()
    {
        $settings = \BigBrotherJunkies\Data\Admin\Pages\ApiSettingsPage::getSettings();

        $this->testMode = $settings['stripe_test_mode'];
        $this->secretKey = $this->testMode
            ? $settings['stripe_test_secret_key']
            : $settings['stripe_live_secret_key'];
        $this->publishableKey = $this->testMode
            ? $settings['stripe_test_publishable_key']
            : $settings['stripe_live_publishable_key'];
        $this->webhookSecret = $this->testMode
            ? $settings['stripe_test_webhook_secret']
            : $settings['stripe_live_webhook_secret'];
    }

    /**
     * Check if Stripe is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->secretKey);
    }

    /**
     * Get publishable key for frontend
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }

    /**
     * Get available plans
     */
    public function getPlans(): array
    {
        return array_map(function ($key, $plan) {
            return [
                'id' => $key,
                'name' => $plan['name'],
                'amount' => $plan['amount'],
                'amount_display' => '$' . number_format($plan['amount'] / 100, 2),
                'interval' => $plan['interval'],
                'is_recurring' => $plan['interval'] !== null,
            ];
        }, array_keys(self::PLANS), self::PLANS);
    }

    /**
     * Get or create a Stripe customer for a WordPress user
     */
    public function getOrCreateCustomer(int $userId): ?string
    {
        $user = get_user_by('ID', $userId);
        if (!$user) {
            return null;
        }

        // Check if user already has a Stripe customer ID
        $customerId = get_user_meta($userId, 'bbj_stripe_customer_id', true);
        if ($customerId) {
            return $customerId;
        }

        // Create new customer
        $response = $this->apiRequest('customers', [
            'email' => $user->user_email,
            'name' => $user->display_name,
            'metadata' => [
                'wp_user_id' => $userId,
                'username' => $user->user_login,
            ],
        ]);

        if ($response && isset($response['id'])) {
            update_user_meta($userId, 'bbj_stripe_customer_id', $response['id']);
            return $response['id'];
        }

        return null;
    }

    /**
     * Create a Stripe Checkout session
     */
    public function createCheckoutSession(int $userId, string $planType, string $successUrl, string $cancelUrl): ?array
    {
        if (!isset(self::PLANS[$planType])) {
            return ['error' => 'Invalid plan type'];
        }

        $plan = self::PLANS[$planType];
        $customerId = $this->getOrCreateCustomer($userId);

        if (!$customerId) {
            return ['error' => 'Failed to create customer'];
        }

        $params = [
            'customer' => $customerId,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'payment_method_types' => ['card'],
            'metadata' => [
                'wp_user_id' => $userId,
                'plan_type' => $planType,
            ],
            'allow_promotion_codes' => true,
        ];

        // Different handling for subscription vs one-time payment
        if ($plan['interval']) {
            // Subscription
            $params['mode'] = 'subscription';
            $params['line_items'] = [[
                'price_data' => [
                    'currency' => 'usd',
                    'unit_amount' => $plan['amount'],
                    'recurring' => [
                        'interval' => $plan['interval'],
                        'interval_count' => $plan['interval_count'],
                    ],
                    'product_data' => [
                        'name' => $plan['name'],
                        'description' => $this->getPlanDescription($planType),
                    ],
                ],
                'quantity' => 1,
            ]];
        } else {
            // One-time payment (lifetime)
            $params['mode'] = 'payment';
            $params['line_items'] = [[
                'price_data' => [
                    'currency' => 'usd',
                    'unit_amount' => $plan['amount'],
                    'product_data' => [
                        'name' => $plan['name'],
                        'description' => $this->getPlanDescription($planType),
                    ],
                ],
                'quantity' => 1,
            ]];
        }

        $response = $this->apiRequest('checkout/sessions', $params);

        if ($response && isset($response['id'])) {
            return [
                'session_id' => $response['id'],
                'url' => $response['url'],
            ];
        }

        return ['error' => $response['error'] ?? 'Failed to create checkout session'];
    }

    /**
     * Get plan description for display
     */
    private function getPlanDescription(string $planType): string
    {
        $descriptions = [
            'monthly' => 'Ad-free browsing, supporter badge, and premium features. Cancel anytime.',
            'annual' => 'Full season of premium access. Over 58% savings vs monthly!',
            'lifetime' => 'Premium access forever. One payment, never expires.',
        ];

        return $descriptions[$planType] ?? '';
    }

    /**
     * Get Stripe Customer Portal URL
     */
    public function createPortalSession(int $userId, string $returnUrl): ?array
    {
        $customerId = get_user_meta($userId, 'bbj_stripe_customer_id', true);

        if (!$customerId) {
            return ['error' => 'No subscription found'];
        }

        $response = $this->apiRequest('billing_portal/sessions', [
            'customer' => $customerId,
            'return_url' => $returnUrl,
        ]);

        if ($response && isset($response['url'])) {
            return ['url' => $response['url']];
        }

        return ['error' => $response['error'] ?? 'Failed to create portal session'];
    }

    /**
     * Cancel a subscription (at period end)
     */
    public function cancelSubscription(string $subscriptionId): ?array
    {
        $response = $this->apiRequest("subscriptions/{$subscriptionId}", [
            'cancel_at_period_end' => true,
        ], 'POST');

        if ($response && isset($response['id'])) {
            return [
                'success' => true,
                'cancel_at' => $response['cancel_at'] ?? null,
            ];
        }

        return ['error' => $response['error'] ?? 'Failed to cancel subscription'];
    }

    /**
     * Get subscription details
     */
    public function getSubscription(string $subscriptionId): ?array
    {
        return $this->apiRequest("subscriptions/{$subscriptionId}", [], 'GET');
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret)) {
            return false;
        }

        $signatureParts = [];
        foreach (explode(',', $signature) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) === 2) {
                $signatureParts[$pair[0]] = $pair[1];
            }
        }

        if (!isset($signatureParts['t']) || !isset($signatureParts['v1'])) {
            return false;
        }

        $timestamp = $signatureParts['t'];
        $expectedSignature = $signatureParts['v1'];

        // Check timestamp tolerance (5 minutes)
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        // Compute expected signature
        $signedPayload = $timestamp . '.' . $payload;
        $computedSignature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);

        return hash_equals($computedSignature, $expectedSignature);
    }

    /**
     * Get plan config by type
     */
    public function getPlanConfig(string $planType): ?array
    {
        return self::PLANS[$planType] ?? null;
    }

    /**
     * Make API request to Stripe
     */
    private function apiRequest(string $endpoint, array $data = [], string $method = 'POST'): ?array
    {
        $url = 'https://api.stripe.com/v1/' . $endpoint;

        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'timeout' => 30,
        ];

        if ($method !== 'GET' && !empty($data)) {
            $args['body'] = $this->buildFormData($data);
        } elseif ($method === 'GET' && !empty($data)) {
            $url .= '?' . http_build_query($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            error_log('Stripe API error: ' . $response->get_error_message());
            return ['error' => $response->get_error_message()];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['error'])) {
            error_log('Stripe API error: ' . json_encode($data['error']));
            return ['error' => $data['error']['message'] ?? 'Unknown error'];
        }

        return $data;
    }

    /**
     * Build form data for Stripe API (handles nested arrays)
     */
    private function buildFormData(array $data, string $prefix = ''): string
    {
        $params = [];
        $this->flattenArray($data, $params, $prefix);
        return http_build_query($params);
    }

    /**
     * Flatten nested array for form data
     */
    private function flattenArray(array $data, array &$result, string $prefix = ''): void
    {
        foreach ($data as $key => $value) {
            $newKey = $prefix ? "{$prefix}[{$key}]" : $key;

            if (is_array($value)) {
                $this->flattenArray($value, $result, $newKey);
            } else {
                $result[$newKey] = $value;
            }
        }
    }
}
