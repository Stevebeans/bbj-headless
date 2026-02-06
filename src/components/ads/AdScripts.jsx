"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

/**
 * Injects ad network scripts into the page.
 * Global scripts (analytics) are rendered server-side in layout.jsx.
 * This component only handles ad network scripts that should be
 * blocked for premium/supporter users.
 */
export function AdScripts({ adHeader, adFooter }) {
  const { user, isAuthenticated } = useAuth();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // If user is a supporter, don't load ad scripts at all
    const isSupporter =
      isAuthenticated &&
      user?.user_roles?.some((role) => SUPPORTER_ROLES.includes(role));

    if (!isSupporter) {
      setShouldLoad(true);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!shouldLoad) return;

    // Inject ad header scripts
    if (adHeader) {
      injectScripts(adHeader, "ad-header-scripts");
    }

    // Inject ad footer scripts
    if (adFooter) {
      injectScripts(adFooter, "ad-footer-scripts");
    }

    return () => {
      // Cleanup on unmount (e.g., if user logs in and becomes supporter)
      document.getElementById("ad-header-scripts")?.remove();
      document.getElementById("ad-footer-scripts")?.remove();
    };
  }, [shouldLoad, adHeader, adFooter]);

  return null;
}

/**
 * Parse an HTML string and inject any <script> tags into the document head.
 * Non-script content is also appended.
 */
function injectScripts(html, containerId) {
  // Remove existing container if re-injecting
  document.getElementById(containerId)?.remove();

  const container = document.createElement("div");
  container.id = containerId;
  container.style.display = "none";

  // Parse the HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Process each element
  const nodes = Array.from(temp.childNodes);
  nodes.forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      // Scripts must be re-created to execute
      const script = document.createElement("script");
      Array.from(node.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });
      if (node.textContent) {
        script.textContent = node.textContent;
      }
      document.head.appendChild(script);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  });

  if (container.childNodes.length > 0) {
    document.head.appendChild(container);
  }
}
