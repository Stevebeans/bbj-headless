import { getSeasonBySlug, getAllSeasonSlugs } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SeasonEditForm } from "./components/SeasonEditForm";
import { Sidebar } from "@/components/layout/Sidebar";
import { FaEye } from "react-icons/fa";

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
        {/* Header - Full Width */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/directory?tab=seasons" className="hover:text-primary-500">
              Directory
            </Link>
            <span>/</span>
            <Link href={`/bigbrother-seasons/${slug}`} className="hover:text-primary-500">
              {season.name}
            </Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-white">
              Edit {season.name}
            </h1>
            <Link
              href={`/bigbrother-seasons/${slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FaEye className="w-4 h-4" />
              View Season
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <SeasonEditForm season={season} players={players} slug={slug} showHeader={false} />
          </div>

          {/* Sidebar */}
          <Sidebar showAds={false} />
        </div>
      </div>
    </main>
  );
}
