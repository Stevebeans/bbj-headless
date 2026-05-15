"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMailingLists } from "@/lib/api/mailing";

function fmtNum(n) {
  return new Intl.NumberFormat().format(n || 0);
}

export default function MailingListsPage() {
  const [lists, setLists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMailingLists();
        setLists(res.lists || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-7 bg-slate-100 dark:bg-slate-800/50 rounded w-40 mb-6" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        Error loading lists: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white">Lists</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage subscriber lists. Click a list to see engagement details and clean up problem subscribers.
        </p>
      </div>

      {lists.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No lists yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Slug</th>
                <th className="px-2 py-2 font-medium text-right">Subscribers</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {lists.map((list) => (
                <tr key={list.id} className="text-slate-700 dark:text-slate-300">
                  <td className="px-2 py-3 font-medium text-slate-800 dark:text-white">
                    <Link href={`/admin/mailing/lists/${list.slug}`} className="hover:text-primary-500">
                      {list.name}
                    </Link>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs">{list.slug}</td>
                  <td className="px-2 py-3 text-right font-mono">{fmtNum(list.subscriber_count)}</td>
                  <td className="px-2 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      list.is_active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}>
                      {list.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href={`/admin/mailing/lists/${list.slug}`}
                      className="text-primary-500 hover:text-primary-600 font-medium"
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
