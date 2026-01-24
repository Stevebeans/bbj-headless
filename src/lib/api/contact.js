import { bbjdFetch } from "./wordpress";

const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get contact form reasons for dropdown
 */
export async function getContactReasons() {
  try {
    const reasons = await bbjdFetch("/contact/reasons", {
      revalidate: 3600, // 1 hour - these rarely change
    });
    return reasons;
  } catch (error) {
    console.error("Failed to fetch contact reasons:", error);
    // Return default reasons as fallback
    return [
      { value: "question", label: "Question" },
      { value: "feedback", label: "Feedback" },
      { value: "bug_report", label: "Report a Bug" },
      { value: "suggestion", label: "Suggestion" },
      { value: "business", label: "Business Inquiry" },
      { value: "other", label: "Other" },
    ];
  }
}

/**
 * Get reCAPTCHA site key
 */
export async function getRecaptchaSiteKey() {
  try {
    const response = await bbjdFetch("/contact/recaptcha-key", {
      revalidate: 3600, // 1 hour
    });
    return response.site_key || "";
  } catch (error) {
    console.error("Failed to fetch reCAPTCHA site key:", error);
    return "";
  }
}

/**
 * Submit contact form
 */
export async function submitContactForm(data) {
  const response = await fetch(`${WORDPRESS_API_URL}/bbjd/v1/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit form");
  }

  return result;
}
