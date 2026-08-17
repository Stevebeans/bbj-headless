// Reusable content snippets for the post editor's "Insert" panel.
// Each button inserts its html at the cursor via TipTap insertContent.
// Add a new snippet = add an entry here; no other code changes needed.
export const EDITOR_SNIPPETS = [
  {
    id: "mel-recaps",
    label: "Mel's Recap Archive",
    description: "Deeper-dive link to the Episode Recaps category",
    html: `<p><em>Want a deeper dive into recent coverage? Check out <a href="/category/episode-recaps">Mel's episode recaps</a> →</em></p>`,
  },
  {
    id: "premium-pitch",
    label: "Premium / Ad-Free",
    description: "Supporter signup pitch",
    html: `<p><em>Tired of ads? <a href="/become-supporter">Become a supporter</a> for $6.95/month to browse ad-free and keep the feed coverage running →</em></p>`,
  },
  {
    id: "lynn-paypal",
    label: "Lynn's Tip Jar",
    description: "PayPal tip link for LynnD's feed updates",
    html: `<p><em>Enjoying the round-the-clock feed updates? <a href="https://www.paypal.com/paypalme/LynnD07" target="_blank" rel="noopener">Toss LynnD a tip</a> to keep the coffee flowing →</em></p>`,
  },
];
