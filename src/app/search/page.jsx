// Ask the Bean — the on-site AI persona of Steve. Full-page chat.
// noindex: authenticated app surface, not SEO content.
import BeanChat from "@/components/bean/BeanChat";

export const metadata = {
  title: "Ask the Bean",
  robots: { index: false, follow: false },
};

export default async function SearchPage({ searchParams }) {
  // `await` is a no-op on the plain object older Next versions pass, and
  // required for the Promise newer ones pass - safe either way.
  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.slice(0, 200) : "";
  return (
    <div className="bean-search-wrap">
      <BeanChat initialQuestion={q} />
    </div>
  );
}
