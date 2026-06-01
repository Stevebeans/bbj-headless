// Ask the Bean — the on-site AI persona of Steve. Full-page chat.
// noindex: authenticated app surface, not SEO content.
import BeanChat from "@/components/bean/BeanChat";

export const metadata = {
  title: "Ask the Bean",
  robots: { index: false, follow: false },
};

export default function SearchPage() {
  return (
    <div className="v2-primary-container">
      <BeanChat />
    </div>
  );
}
