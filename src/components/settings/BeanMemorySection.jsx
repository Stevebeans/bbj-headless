"use client";

import { useEffect, useState } from "react";
import { getBeanStatus, resetBeanMemory } from "@/lib/api/bean";

export default function BeanMemorySection({ showToast }) {
  const [eligible, setEligible] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    getBeanStatus()
      .then((s) => setEligible(!!s.memory))
      .catch(() => {});
  }, []);

  if (!eligible) return null;

  const handleReset = async () => {
    if (!confirm("Reset what Steve remembers about you? He'll start fresh next time you chat.")) return;
    setResetting(true);
    try {
      await resetBeanMemory();
      showToast?.("Steve's memory of you has been reset.");
    } catch (e) {
      showToast?.(e.message || "Couldn't reset memory", "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ask the Bean</h3>
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Steve&apos;s memory of you</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            As a Full Bean member, Steve remembers the gist of your chats so it feels like talking to a friend. Reset it to have him start fresh.
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="ml-3 shrink-0 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          {resetting ? "Resetting..." : "Reset Memory"}
        </button>
      </div>
    </div>
  );
}
