"use client";

import QueueList from "./QueueList";

// Thin wrapper: the shared QueueList replaced this tab's old list, whose Edit
// flow round-tripped through DraftEditor's create-only paths and duplicated
// queued rows instead of updating them.
export default function Queue() {
  return <QueueList />;
}
