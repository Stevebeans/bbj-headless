"use client";

export function SeasonTOC({ sections }) {
  if (!sections?.length) return null;
  function jump(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }
  return (
    <div className="card toc">
      <h4>On This Page</h4>
      <ul>
        {sections.map(({ id, label, count }) => (
          <li key={id}><a href={`#${id}`} onClick={(e) => jump(e, id)}><span>{label}</span>{count != null ? <span>{count}</span> : null}</a></li>
        ))}
      </ul>
    </div>
  );
}
