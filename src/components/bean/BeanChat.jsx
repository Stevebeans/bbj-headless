"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { streamBeanChat } from "@/lib/api/bean";

const SUGGESTIONS = [
  "Who won Big Brother 14?",
  "Best player to never win?",
  "Is this season any good so far?",
  "How was your day, Steve?",
];

/** The bean — Steve's avatar. Swap the emoji for the mascot art when it's finalized. */
function BeanAvatar({ size = "md" }) {
  const dims = size === "lg" ? "h-16 w-16 text-3xl" : size === "sm" ? "h-8 w-8 text-base" : "h-10 w-10 text-xl";
  return (
    <span
      className={`${dims} grid shrink-0 place-items-center rounded-full bg-primary-500 ring-2 ring-secondary-500 shadow-sm select-none`}
      aria-hidden="true"
    >
      🫘
    </span>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 bean-rise">
      <BeanAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <span className="flex gap-1">
          <span className="bean-dot h-2 w-2 rounded-full bg-primary-400" />
          <span className="bean-dot h-2 w-2 rounded-full bg-primary-400" style={{ animationDelay: "0.2s" }} />
          <span className="bean-dot h-2 w-2 rounded-full bg-primary-400" style={{ animationDelay: "0.4s" }} />
        </span>
      </div>
    </div>
  );
}

function Sources({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.slice(0, 3).map((s, i) => (
        <a
          key={i}
          href={s.url}
          className="inline-flex max-w-[15rem] items-center gap-1 truncate rounded-full border border-gray-200 dark:border-gray-700 bg-paper dark:bg-gray-900 px-2.5 py-0.5 text-xs text-primary-600 dark:text-secondary-500 hover:border-primary-400 transition-colors"
          title={s.title}
        >
          <span className="text-[0.65rem] opacity-60">↗</span>
          <span className="truncate">{s.title}</span>
        </a>
      ))}
    </div>
  );
}

function Message({ m }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end bean-rise">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-500 px-4 py-2.5 text-white shadow-sm whitespace-pre-wrap break-words">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 bean-rise">
      <BeanAvatar size="sm" />
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-gray-800 dark:text-gray-100 shadow-sm whitespace-pre-wrap break-words">
          {m.text}
          {m.streaming && <span className="ml-0.5 inline-block h-4 w-0.5 -mb-0.5 animate-pulse bg-primary-400 align-middle" />}
        </div>
        {!m.streaming && <Sources sources={m.sources} />}
      </div>
    </div>
  );
}

export default function BeanChat() {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [messages, setMessages] = useState([]); // {role:'user'|'bean', text, sources?, streaming?}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  const textarea = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const grow = useCallback(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    if (!user) {
      openLogin();
      return;
    }

    // History = completed turns so far (raw text), before we append the new pair.
    const history = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    setInput("");
    if (textarea.current) textarea.current.style.height = "auto";
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bean", text: "", sources: [], streaming: true }]);

    await streamBeanChat(
      q,
      history,
      {
        onSources: (sources) =>
          setMessages((m) => {
            const c = [...m];
            c[c.length - 1] = { ...c[c.length - 1], sources };
            return c;
          }),
        onDelta: (t) =>
          setMessages((m) => {
            const c = [...m];
            c[c.length - 1] = { ...c[c.length - 1], text: c[c.length - 1].text + t };
            return c;
          }),
        onError: (msg) =>
          setMessages((m) => {
            const c = [...m];
            c[c.length - 1] = { ...c[c.length - 1], text: msg, streaming: false };
            return c;
          }),
      }
    );
    setMessages((m) => {
      const c = [...m];
      if (c.length) c[c.length - 1] = { ...c[c.length - 1], streaming: false };
      return c;
    });
    setBusy(false);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-h-[920px] w-full max-w-3xl flex-col px-3 sm:px-4">
      {/* Identity bar */}
      <header className="flex items-center gap-3 border-b border-gray-200/70 dark:border-gray-700/70 px-1 py-3">
        <BeanAvatar />
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl text-primary-600 dark:text-secondary-500">Steve Beans</span>
            <span className="rounded-full bg-secondary-500/90 px-1.5 py-px text-[0.6rem] font-osw font-semibold uppercase tracking-wider text-primary-600">
              AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" data-nosnippet>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Big Brother, all day. Ask me anything.
          </div>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scroller} className="flex-1 min-h-0 space-y-4 overflow-y-auto py-5">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <BeanAvatar size="lg" />
            <p className="mt-4 font-hand text-3xl text-primary-600 dark:text-secondary-500">Hey, I&rsquo;m Steve.</p>
            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              An AI re-creation of me, chatting Big Brother with the junkies. Spicy takes, real history, no fake facts.
              Pull up a chair.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 px-3.5 py-1.5 text-sm text-primary-600 dark:text-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary-500 hover:shadow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <Message key={i} m={m} />
            ))}
            {busy && messages[messages.length - 1]?.text === "" && <TypingBubble />}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200/70 dark:border-gray-700/70 pt-3 pb-4">
        {user ? (
          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <textarea
              ref={textarea}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                grow();
              }}
              onKeyDown={onKeyDown}
              placeholder="Talk to Steve…"
              aria-label="Message Steve Beans"
              className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary-500 text-primary-600 transition-all hover:bg-secondary-600 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={openLogin} className="btn-primary w-full justify-center">
            Log in to chat with Steve
          </button>
        )}
        <p className="mt-2 text-center text-[0.7rem] text-gray-400 dark:text-gray-500" data-nosnippet>
          Steve Beans is an AI re-creation — he can be wrong, so double-check the big stuff.
        </p>
      </div>
    </div>
  );
}
