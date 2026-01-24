import { getSeasonBySlug, getAllSeasonSlugs } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import { SeasonEditForm } from "./components/SeasonEditForm";
import { Sidebar } from "@/components/layout/Sidebar";

// Allow dynamic rendering for seasons not pre-generated at build time
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllSeasonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { season } = await getSeasonBySlug(slug);

  if (!season) {
    return { title: "Season Not Found" };
  }

  return {
    title: `Edit ${season.name} - BBJ Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function SeasonEditPage({ params }) {
  const { slug } = await params;
  const { season, players } = await getSeasonBySlug(slug);

  if (!season) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <SeasonEditForm season={season} players={players} slug={slug} />
          </div>

          {/* Sidebar */}
          <Sidebar showAds={false} />
        </div>
      </div>
    </main>
  );
}
