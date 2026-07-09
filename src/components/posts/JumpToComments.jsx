"use client";

function CommentIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function scrollToComments() {
  const commentsSection = document.getElementById("comments");
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: "smooth" });
  }
}

export function HeroJumpToComments({ commentCount = 0 }) {
  return (
    <button
      onClick={scrollToComments}
      className="absolute bottom-3 right-3 flex items-center gap-1.5
        bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white
        px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors"
      aria-label="Jump to comments"
    >
      <CommentIcon className="w-4 h-4" />
      <span>{commentCount > 0 ? `${commentCount} Comments` : "Comments"}</span>
      <ChevronDownIcon className="w-3.5 h-3.5" />
    </button>
  );
}

export function JumpToComments({ commentCount = 0 }) {
  return (
    <button
      onClick={scrollToComments}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
        bg-primary-500 hover:bg-primary-600 text-white
        px-4 py-3 rounded-full shadow-lg
        transition-all duration-300 hover:scale-105
        group"
      aria-label="Jump to comments"
    >
      <CommentIcon className="w-5 h-5" />
      <span className="text-sm font-medium">
        {commentCount > 0 ? commentCount : "Comments"}
      </span>
    </button>
  );
}
