import { Sidebar } from "./Sidebar";

// Page layout wrapper with optional sidebar
// Server Component
export function PageLayout({ children, showSidebar = true, user = null }) {
  return (
    <div className="v2-primary-container">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content */}
        <article className="flex-1 min-w-0">
          {children}
        </article>

        {/* Sidebar */}
        {showSidebar && <Sidebar user={user} />}
      </div>
    </div>
  );
}
