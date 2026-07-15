"use client";

import { useEffect, useState, useCallback } from "react";
import { getWelcomeEmails, saveWelcomeEmails, sendWelcomeEmailTest } from "@/lib/api/welcomeEmails";

const TAGS = [
  "{{first_name}}", "{{display_name}}", "{{site_url}}", "{{current_season}}",
  "{{plan_name}}", "{{amount}}", "{{next_billing_date}}",
  "{{settings_url}}", "{{manage_subscription_url}}", "{{cancel_url}}",
  "{{confirm_url}}", "{{unsubscribe_url}}",
];

function Editor({ title, note, subject, body, onSubject, onBody, onInsert }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 mb-6">
      <h3 className="font-osw font-bold text-lg text-slate-800 dark:text-white mb-1">{title}</h3>
      {note && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{note}</p>}
      {subject !== null && (
        <input
          className="w-full mb-3 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm"
          placeholder="Subject"
          value={subject}
          onChange={(e) => onSubject(e.target.value)}
        />
      )}
      <textarea
        className="w-full h-48 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm font-mono"
        value={body}
        onChange={(e) => onBody(e.target.value)}
      />
      <div className="flex flex-wrap gap-1 mt-2">
        {TAGS.map((t) => (
          <button key={t} type="button" onClick={() => onInsert(t)}
            className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function TestButton({ which, label, onTest, busy }) {
  return (
    <button
      type="button"
      onClick={() => onTest(which)}
      disabled={!!busy}
      className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white disabled:opacity-50 transition-colors"
    >
      {busy === which ? "Saving & sending…" : `✉️ ${label}`}
    </button>
  );
}

export default function WelcomeEmailsPage() {
  const [tpl, setTpl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [testing, setTesting] = useState("");

  const load = useCallback(async () => {
    try {
      setTpl(await getWelcomeEmails());
    } catch (e) {
      setMsg(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (!tpl) return <div className="p-6 text-red-500">{msg || "No data"}</div>;

  const setField = (group, key, val) =>
    setTpl((p) => ({ ...p, [group]: { ...p[group], [key]: val } }));
  const insert = (group, key) => (tag) =>
    setTpl((p) => ({ ...p, [group]: { ...p[group], [key]: (p[group]?.[key] || "") + " " + tag } }));

  const save = async () => {
    setMsg("Saving…");
    try {
      const res = await saveWelcomeEmails(tpl);
      setMsg(res.success ? "Saved." : res.message || "Save failed");
    } catch (e) {
      setMsg(e.message || "Save failed");
    }
  };

  // Save the current edits first so the test reflects exactly what's in the boxes, then send.
  const test = async (which) => {
    setTesting(which);
    setMsg(`Saving & sending ${which} test…`);
    try {
      const saved = await saveWelcomeEmails(tpl);
      if (!saved.success) {
        setMsg(saved.message || "Save failed — fix the template before testing");
        return;
      }
      const res = await sendWelcomeEmailTest(which);
      setMsg(res.message || (res.success ? "Test sent ✓" : "Send failed"));
    } catch (e) {
      setMsg(e.message || "Failed");
    } finally {
      setTesting("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white">Welcome Emails</h1>
        <div className="flex gap-2">
          {msg && <span className="text-sm text-slate-500 self-center">{msg}</span>}
          <button onClick={save} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium">Save all</button>
        </div>
      </div>

      <Editor
        title="1. Confirmation Email"
        note="Sent right after signup. MUST contain {{confirm_url}} (the confirm button)."
        subject={tpl.confirmation.subject}
        body={tpl.confirmation.body_html}
        onSubject={(v) => setField("confirmation", "subject", v)}
        onBody={(v) => setField("confirmation", "body_html", v)}
        onInsert={insert("confirmation", "body_html")}
      />
      <TestButton which="confirmation" label="Save & send confirmation test to me" onTest={test} busy={testing} />

      <Editor
        title="2. Welcome Email"
        note="Sent after the user confirms their email."
        subject={tpl.welcome.subject}
        body={tpl.welcome.body_html}
        onSubject={(v) => setField("welcome", "subject", v)}
        onBody={(v) => setField("welcome", "body_html", v)}
        onInsert={insert("welcome", "body_html")}
      />
      <Editor
        title="↳ Newsletter section"
        note="Appended to the welcome email ONLY when the user opted into post notifications."
        subject={null}
        body={tpl.welcome_newsletter_fragment}
        onSubject={() => {}}
        onBody={(v) => setTpl((p) => ({ ...p, welcome_newsletter_fragment: v }))}
        onInsert={(tag) => setTpl((p) => ({ ...p, welcome_newsletter_fragment: (p.welcome_newsletter_fragment || "") + " " + tag }))}
      />
      <TestButton which="welcome" label="Save & send welcome test to me" onTest={test} busy={testing} />

      <Editor
        title="3. Premium Signup Email"
        note="Sent when a new subscription activates (Stripe or PayPal)."
        subject={tpl.premium.subject}
        body={tpl.premium.body_html}
        onSubject={(v) => setField("premium", "subject", v)}
        onBody={(v) => setField("premium", "body_html", v)}
        onInsert={insert("premium", "body_html")}
      />
      <TestButton which="premium" label="Save & send premium test to me" onTest={test} busy={testing} />
    </div>
  );
}
