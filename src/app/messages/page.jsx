import { Suspense } from "react";
import MessagesClient from "@/components/messages/MessagesClient";

export const metadata = {
  title: "Messages",
  description: "Your private conversations on Big Brother Junkies.",
};

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
