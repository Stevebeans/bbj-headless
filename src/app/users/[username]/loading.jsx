import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { UserProfileSkeleton } from "@/components/users";

export default function UserProfileLoading() {
  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow">
          <UserProfileSkeleton />
        </section>

        {/* Sidebar */}
        <Sidebar>
          <SubscribeWidget />
        </Sidebar>
      </div>
    </main>
  );
}
