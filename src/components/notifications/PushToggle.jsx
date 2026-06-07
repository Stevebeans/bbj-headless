"use client";
import { useEffect, useState } from "react";
import { pushSupported, enablePush, disablePush, isPushEnabled } from "@/lib/push";
import { getToken } from "@/lib/auth/cookies";

export default function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setSupported(pushSupported());
    isPushEnabled().then(setOn).catch(() => {});
  }, []);

  if (!supported) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Push notifications aren&apos;t supported on this device/browser. On iPhone, add BBJ to your
        home screen first, then enable.
      </p>
    );
  }

  const toggle = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (on) {
        await disablePush();
        setOn(false);
      } else {
        await enablePush(getToken());
        setOn(true);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">Push notifications</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Get breaking BB alerts on this device.
        </p>
        {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`px-4 py-2 rounded-lg font-medium ${
          on ? "bg-emerald-600 text-white" : "bg-primary-500 text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {busy ? "…" : on ? "On" : "Enable"}
      </button>
    </div>
  );
}
