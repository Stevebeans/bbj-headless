/**
 * Billing API functions for premium subscriptions
 */

import { getAuthHeader } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get available plans and payment provider configuration
 */
export async function getPlans() {
  const response = await fetch(`${API_URL}/bbjd/v1/billing/plans`);

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  return response.json();
}

/**
 * Get current user's subscription status
 */
export async function getSubscription() {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/subscription`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch subscription");
  }

  return response.json();
}

/**
 * Create Stripe checkout session
 * @param {string} planType - 'monthly', 'annual', or 'lifetime'
 * @param {string} successUrl - URL to redirect to on success
 * @param {string} cancelUrl - URL to redirect to on cancel
 */
export async function createStripeCheckout(planType, successUrl, cancelUrl) {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      plan_type: planType,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create checkout session");
  }

  return data;
}

/**
 * Create PayPal order (for lifetime one-time payment)
 * @param {string} returnUrl - URL for PayPal to redirect after approval
 * @param {string} cancelUrl - URL for PayPal to redirect on cancel
 */
export async function createPayPalOrder(returnUrl, cancelUrl) {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/create-paypal-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      plan_type: "lifetime",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create PayPal order");
  }

  return data;
}

/**
 * Capture PayPal order after user approval
 * @param {string} orderId - PayPal order ID
 */
export async function capturePayPalOrder(orderId) {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/capture-paypal-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      order_id: orderId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to capture PayPal order");
  }

  return data;
}

/**
 * Create PayPal subscription (for monthly/annual recurring)
 * @param {string} planType - 'monthly' or 'annual'
 * @param {string} returnUrl - URL for PayPal to redirect after approval
 * @param {string} cancelUrl - URL for PayPal to redirect on cancel
 */
export async function createPayPalSubscription(planType, returnUrl, cancelUrl) {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/create-paypal-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      plan_type: planType,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create PayPal subscription");
  }

  return data;
}

/**
 * Get Stripe customer portal URL
 * @param {string} returnUrl - URL to return to after portal session
 */
export async function getPortalUrl(returnUrl) {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const params = new URLSearchParams({ return_url: returnUrl });
  const response = await fetch(`${API_URL}/bbjd/v1/billing/portal?${params}`, {
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get portal URL");
  }

  return data;
}

/**
 * Cancel active subscription
 */
export async function cancelSubscription() {
  const headers = getAuthHeader();
  if (!headers.Authorization) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/billing/cancel`, {
    method: "POST",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel subscription");
  }

  return data;
}
