// Placeholder route reserved for a future on-site AI helper ("Ask the Bean")
// that answers questions from site content. noindex while it's a stub.
export const metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

export default function SearchPage() {
  return (
    <main className="v2-primary-container">
      <div className="card text-center py-16">
        <h1 className="section-header">Search</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Site search is coming soon — we&rsquo;re building something special here.
        </p>
      </div>
    </main>
  );
}
