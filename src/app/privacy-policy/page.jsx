import { notFound } from "next/navigation";
import { getPage } from "@/lib/api/posts";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = false; // Static page — invalidate via webhook on edit

export async function generateMetadata() {
  const page = await getPage("privacy-policy");

  if (!page) {
    return { title: "Privacy Policy" };
  }

  return {
    title: page.title,
    description:
      "Privacy policy for Big Brother Junkies — how we handle your data.",
    alternates: {
      canonical: `${SITE_URL}/privacy-policy`,
    },
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getPage("privacy-policy");

  if (!page) {
    notFound();
  }

  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
        <section id="main-left" className="flex-grow space-y-4">
          <article className="v2-primary-container-inner p-4 md:p-8">
            <h1 className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400 mb-6">
              {page.title}
            </h1>
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </article>
        </section>

        <Sidebar showAds={true}>
          <SubscribeWidget />
        </Sidebar>
      </div>
    </main>
  );
}
