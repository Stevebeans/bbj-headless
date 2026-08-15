// Builds the architecture docs into a small local HTML site.
//
//   node docs/architecture/build.mjs
//
// Reads every .md in this directory, writes styled HTML to ./site/
// (gitignored — the .md files are the source of truth). Open
// site/index.html directly, or via XAMPP at
// http://localhost/bbj-app/docs/architecture/site/
//
// File references like `src/app/layout.jsx:134` become vscode:// links
// that open VS Code at that exact line.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const DOCS_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DOCS_DIR, "site");
const REPO_ROOT = path.resolve(DOCS_DIR, "..", "..");

const CSS = `
  :root {
    --bg: #faf9f6; --fg: #2a2a2e; --muted: #6b7280; --accent: #35546e;
    --code-bg: #eef1f4; --border: #ddd; --sidebar-bg: #fffdf8;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1b1d21; --fg: #d9dbe0; --muted: #9aa1ac; --accent: #8fb4d4;
      --code-bg: #26292f; --border: #3a3e46; --sidebar-bg: #202329;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 17px/1.65 Georgia, "Times New Roman", serif;
  }
  main { max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.5rem 6rem; }
  h1, h2, h3 { font-family: "Segoe UI", system-ui, sans-serif; line-height: 1.25; }
  h1 { font-size: 1.9rem; border-bottom: 2px solid var(--accent); padding-bottom: .4rem; }
  h2 { font-size: 1.35rem; margin-top: 2.2rem; }
  a { color: var(--accent); }
  em { color: var(--muted); }
  code {
    font: 0.86em "Cascadia Mono", Consolas, "Courier New", monospace;
    background: var(--code-bg); padding: .12em .35em; border-radius: 4px;
  }
  pre {
    background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 1rem 1.2rem; overflow-x: auto; line-height: 1.45;
  }
  pre code { background: none; padding: 0; font-size: .82rem; }
  blockquote {
    margin: 1.4rem 0; padding: .7rem 1.1rem; border-left: 4px solid var(--accent);
    background: var(--sidebar-bg); border-radius: 0 8px 8px 0;
    font-family: "Segoe UI", system-ui, sans-serif; font-size: .95rem;
  }
  table { border-collapse: collapse; width: 100%; font-size: .92rem; }
  th, td { border: 1px solid var(--border); padding: .45rem .7rem; text-align: left; }
  th { font-family: "Segoe UI", system-ui, sans-serif; }
  nav.crumbs {
    font-family: "Segoe UI", system-ui, sans-serif; font-size: .85rem;
    margin-bottom: 1.5rem; color: var(--muted);
  }
  ul.toc { list-style: none; padding: 0; }
  ul.toc li { margin: .6rem 0; }
  ul.toc .desc { color: var(--muted); font-size: .9rem; display: block; }
  footer { margin-top: 3rem; color: var(--muted); font-size: .8rem;
    font-family: "Segoe UI", system-ui, sans-serif; }
`;

function page(title, body, isIndex = false) {
  const crumbs = isIndex ? "" : `<nav class="crumbs"><a href="index.html">← All chapters</a></nav>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — BBJ Architecture</title><style>${CSS}</style></head>
<body><main>${crumbs}${body}
<footer>Generated ${new Date().toLocaleString()} — source: docs/architecture/*.md — rebuild: <code>node docs/architecture/build.mjs</code></footer>
</main></body></html>`;
}

// `src/app/layout.jsx:134` (or :36-55 ranges, or no line at all) → open-in-VS-Code link.
function linkFileRefs(html) {
  return html.replace(
    /<code>((?:src|docs)\/[\w\-./[\]]+\.(?:jsx?|mjs|php|css|md))(?::(\d+)(?:-\d+)?)?((?::\d+(?:-\d+)?)*)<\/code>/g,
    (match, file, line) => {
      const target = path.join(REPO_ROOT, file).replace(/\\/g, "/");
      const href = `vscode://file/${target}${line ? `:${line}` : ""}`;
      return `<a href="${href}" title="Open in VS Code">${match}</a>`;
    }
  );
}

const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md")).sort();
await mkdir(OUT_DIR, { recursive: true });

const chapters = [];
for (const file of files) {
  const md = await readFile(path.join(DOCS_DIR, file), "utf8");
  const title = md.match(/^#\s+(.+)$/m)?.[1] ?? file;
  const firstPara = md.split(/\r?\n\r?\n/).find((p) => /^[A-Z*_]/.test(p.trim()) && !p.startsWith("#"));
  const html = linkFileRefs(marked.parse(md));
  const out = file.replace(/\.md$/, ".html");
  await writeFile(path.join(OUT_DIR, out), page(title, html));
  chapters.push({ out, title, desc: (firstPara ?? "").replace(/[*_`]/g, "").slice(0, 140) });
  console.log(`built ${out}`);
}

const toc = chapters
  .map((c) => `<li><a href="${c.out}">${c.title}</a><span class="desc">${c.desc}</span></li>`)
  .join("\n");
await writeFile(
  path.join(OUT_DIR, "index.html"),
  page("BBJ Architecture Docs", `<h1>BBJ Architecture Docs</h1>
<p>The learn-the-site series. Read in order; the glossary is for lookups.
File references open VS Code when clicked.</p>
<ul class="toc">${toc}</ul>`, true)
);
console.log(`built index.html (${chapters.length} pages) → ${OUT_DIR}`);
