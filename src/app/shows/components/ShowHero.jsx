import { Torch } from "./ShowArt";

/**
 * Dark, torch-lit hero band for the Shows pages. Server component, static
 * content only (these pages are revalidate=false shells).
 *
 * `show` picks the accent palette in shows.css ("hub" or a show slug).
 * `title` may contain markup (e.g. an outlined season number).
 */
export function ShowHero({ show, kicker, live = false, title, tagline, chips = [], torches = 0, children }) {
  return (
    <header className="shw-hero" data-show={show}>
      <div className="shw-hero-grid">
        <div>
          <p className="shw-kicker">
            {live && <span className="shw-dot" aria-hidden="true" />}
            {kicker}
          </p>
          <h1 className="shw-title">{title}</h1>
          {tagline && <p className="shw-tagline">{tagline}</p>}
          {chips.length > 0 && (
            <div className="shw-chips">
              {chips.map((c) => (
                <span key={c.label} className="shw-chip">
                  {c.strong && <b>{c.strong} </b>}
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {torches > 0 && (
          <div className="shw-torches" aria-hidden="true">
            {Array.from({ length: torches }, (_, i) => (
              <Torch key={i} />
            ))}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
