import { getSeasonBySlug, getAllSeasonSlugs } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import { SeasonEditForm } from "./components/SeasonEditForm";

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SeasonEditForm season={season} players={players} />
    </main>
  );
}
