import { Suspense } from "react";
import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = {
  title: "Messages",
  description: "Your private conversations on Big Brother Junkies.",
};

export default async function MessagesPage({ searchParams }) {
  // Profile "Message" button deep-links here as ?to={userId}&name={username}.
  // Read it server-side and hand MessagesClient a recipient to open compose on.
  const sp = (await searchParams) || {};
  const toId = parseInt(Array.isArray(sp.to) ? sp.to[0] : sp.to, 10);
  const rawName = Array.isArray(sp.name) ? sp.name[0] : sp.name;
  const name = typeof rawName === "string" ? rawName : "";
  const initialRecipient =
    Number.isFinite(toId) && toId > 0
      ? { id: toId, username: name, name: name || "Member" }
      : null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      }
    >
      <MessagesClient initialRecipient={initialRecipient} />
    </Suspense>
  );
}
