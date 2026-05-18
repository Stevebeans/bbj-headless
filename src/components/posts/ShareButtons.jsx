"use client";

import { useState } from "react";

export function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");

  const handleCopy = async (e) => {
    e.preventDefault();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div
      className="flex items-center gap-2 shrink-0"
      aria-label="Share this post"
    >
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bbj-share-btn"
        aria-label="Share on X"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-6.9L4.7 22H1.6l8-9.2L1 2h6.9l4.8 6.3L18.9 2z" />
        </svg>
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bbj-share-btn"
        aria-label="Share on Facebook"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07C2 17.1 5.66 21.25 10.44 22V14.9H7.9v-2.83h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.83h-2.34V22C18.34 21.25 22 17.1 22 12.07z" />
        </svg>
      </a>

      <a
        href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bbj-share-btn"
        aria-label="Share on Reddit"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm5.22 11a1.77 1.77 0 0 1-1.12 1.63 3.92 3.92 0 0 1 .07.7c0 2.2-2.75 4-6.17 4s-6.17-1.78-6.17-4a3.92 3.92 0 0 1 .07-.7A1.78 1.78 0 0 1 5.85 11.5a1.78 1.78 0 0 1 1.3.57 7.45 7.45 0 0 1 3.92-1.12l.67-3.13 2.25.47a1.22 1.22 0 1 1-.18.82l-1.89-.4-.59 2.7a7.54 7.54 0 0 1 3.89 1.14 1.78 1.78 0 0 1 1.3-.57A1.77 1.77 0 0 1 18 11z" />
        </svg>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className={`bbj-share-btn ${copied ? "is-copied" : ""}`}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
    </div>
  );
}
