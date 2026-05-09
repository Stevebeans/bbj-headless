"use client";

const PARAMOUNT_PLUS_URL =
  "https://paramountplus.qflm.net/c/161260/3116110/3065";

export function ParamountPlusCard() {
  return (
    <section className="bbj-sidebar-card">
      <div className="bg-primary-500 text-white p-4 rounded-md">
        <h2 className="font-display text-2xl mb-2">
          Watch Live on Paramount+
        </h2>
        <p className="text-sm opacity-90 mb-3">
          Stream the full BB live feeds and CBS episodes. 7-day free trial.
        </p>
        <a
          href={PARAMOUNT_PLUS_URL}
          target="_blank"
          rel="noopener sponsored"
          className="btn-secondary w-full text-center block"
        >
          Start free trial
        </a>
      </div>
    </section>
  );
}
