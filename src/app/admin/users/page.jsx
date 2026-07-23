"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { listAdminUsers } from "@/lib/api/adminUsers";
import { getRoles } from "@/lib/api/admin";
import DmReportsCard from "@/components/admin/users/DmReportsCard";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = useCallback(async (pageNum = 1, searchTerm = search, role = roleFilter) => {
    setLoading(true);
    try {
      const data = await listAdminUsers({
        page: pageNum,
        perPage: 25,
        search: searchTerm,
        role,
      });
      setUsers(data.users || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    getRoles().then((data) => setRoles(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">User Management</h2>
      </div>

      <DmReportsCard />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.key} value={r.key}>{r.name || r.key}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">No users found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-12"></th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Roles</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Subscription</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Registered</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-20 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3">
                      {u.avatar ? (
                        <Image src={u.avatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-gray-900 dark:text-gray-200 font-medium">{u.display_name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">@{u.user_login}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map((r) => (
                          <span key={r} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {u.subscription_status ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">{u.subscription_status}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                      {u.registered ? new Date(u.registered).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <Link href={`/admin/users/${u.id}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
                <button onClick={() => fetchUsers(page + 1)} disabled={page >= pagination.total_pages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
