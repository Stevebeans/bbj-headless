"use client";

import { useEffect } from "react";

// Post content is server-rendered via dangerouslySetInnerHTML, which never
// executes <script> tags — so oEmbed blockquotes (tweets, IG posts) arrive
// inert. This component detects them after mount and loads each platform's
// widget script once, then asks it to (re)scan the page. Renders nothing.

const loaders = {};
function loadScriptOnce(src, key) {
  if (!loaders[key]) {
    loaders[key] = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = resolve; // blocked script = embeds stay as styled quotes; never throw
      document.body.appendChild(s);
    });
  }
  return loaders[key];
}

export function EmbedHydrator() {
  useEffect(() => {
    if (document.querySelector("blockquote.twitter-tweet")) {
      loadScriptOnce("https://platform.twitter.com/widgets.js", "twitter").then(() =>
        window.twttr?.widgets?.load()
      );
    }
    if (document.querySelector("blockquote.instagram-media")) {
      loadScriptOnce("https://www.instagram.com/embed.js", "instagram").then(() =>
        window.instgrm?.Embeds?.process()
      );
    }
  }, []);

  return null;
}
