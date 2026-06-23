"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { streamBeanChat } from "@/lib/api/bean";
import { humanize } from "@/lib/bean/humanize";
import { UPGRADE_URL } from "@/lib/bean/tiers";
import { decodeHtml } from "@/lib/utils/decodeHtml";

const UPSELL_OFFERS = {
  full_bean: {
    name: "Full Bean",
    price: "$14.99/mo",
    blurb: "The smarter me (no limits), and I actually remember our conversations.",
    cta: "Go Full Bean",
    primary: true,
    url: `${UPGRADE_URL}?plan=full_bean_annual`,
  },
  supporter: {
    name: "Supporter",
    price: "$6.95/mo",
    blurb: "Ad-free, plus way more daily chats with me.",
    cta: "Become a Supporter",
    url: UPGRADE_URL,
  },
};

function UpsellCard({ tier }) {
  const offers = tier === "supporter" ? ["full_bean"] : ["full_bean", "supporter"];
  return (
    <div className="bean-upsell">
      <div className="uh">Keep it going 🫘</div>
      {offers.map((k) => {
        const o = UPSELL_OFFERS[k];
        return (
          <div className="opt" key={k}>
            <div className="info">
              <b>
                {o.name} · {o.price}
              </b>
              <small>{o.blurb}</small>
            </div>
            <a className={"cta" + (o.primary ? " primary" : "")} href={o.url || UPGRADE_URL}>
              {o.cta}
            </a>
          </div>
        );
      })}
      <div className="note">A friendly exchange. I promise not to nominate you if I win HoH. 🤝</div>
    </div>
  );
}

const BEAN = {
  wave: "/bean/bean-wave.png",
  think: "/bean/bean-think.png",
  point: "/bean/bean-point.png",
  thumb: "/bean/bean-thumbsup.png",
  neutral: "/bean/bean-neutral.png",
  stand: "/bean/bean-stand.png",
};
// Rotate the Bean's expression across answers so he feels alive.
const ANSWER_POSES = [BEAN.neutral, BEAN.point, BEAN.thumb, BEAN.stand];

const SUGGESTIONS = [
  { tag: "Live", cls: "live", qt: "Who's HoH right now?", qs: "Noms, veto & the block", q: "Who's HoH this week?" },
  { tag: "Recap", cls: "hist", qt: "Catch me up on BB27", qs: "The whole season, fast", q: "Catch me up on BB27" },
  { tag: "Take", cls: "stat", qt: "Best player to never win?", qs: "Give me a spicy take", q: "Who's the best player to never win Big Brother?" },
  { tag: "Hang", cls: "help", qt: "How was your day, Steve?", qs: "Just here to chat", q: "How was your day, Steve?" },
];

function AnswerCard({ card }) {
  if (!card) return null;

  if (card.kind === "player") {
    return (
      <div className="bcard">
        <div className="bc-hg">
          <div className="portrait">
            {card.photo ? <img src={card.photo} alt="" /> : <span className="ini">{card.initial}</span>}
          </div>
          <div className="info">
            <div className="nm">{card.name}</div>
            {card.sub && <div className="sub">{card.sub}</div>}
            {card.tags?.length > 0 && (
              <div className="tags">
                {card.tags.map((t, i) => (
                  <span key={i} className={"t " + (t.cls || "")}>{t.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bc-stats">
          {card.stats.map((s, i) => (
            <div key={i} className={"s " + (s.cls || "")}>
              <div className="n">{s.n}</div>
              <div className="k">{s.k}</div>
            </div>
          ))}
        </div>
        {card.url && (
          <a className="bcard-link" href={card.url}>
            Full profile →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bcard">
      <div className="bc-h">
        <span className="k">{card.kind === "week" ? "Result" : "Season"}</span>
        <span className="title">{decodeHtml(card.title)}</span>
        <span className="spacer" />
        {card.sub && <span className="wk">{decodeHtml(card.sub)}</span>}
      </div>
      <div className="bc-week">
        {card.rows.map((r, i) => {
          const joined = decodeHtml(r.names.join(", "));
          const cls = !joined ? "name empty" : joined.length > 14 || r.names.length > 1 ? "name sm" : "name";
          return (
            <div key={i} className={"slot " + r.cls}>
              <div className="lab">{r.lab}</div>
              <div className={cls}>{joined || "—"}</div>
            </div>
          );
        })}
      </div>
      {card.evicted?.length > 0 && (
        <div className="bc-evicted">
          Evicted<b>{card.evicted.join(", ")}</b>
        </div>
      )}
      {card.url && (
        <a className="bcard-link" href={card.url}>
          Full season →
        </a>
      )}
    </div>
  );
}

function BeanRow({ m }) {
  return (
    <div className="bean-row">
      <span className="bean-av">
        <img src={m.pose || BEAN.neutral} alt="" />
      </span>
      <div className="bean-stack">
        <div className="bean-who">
          <b>Steve Beans</b>
          <span className="verified">✦ AI</span>
        </div>
        <div className="bubble">
          {humanize(m.text)}
          {m.streaming && <span className="bean-caret" />}
        </div>
        {m.card && <AnswerCard card={m.card} />}
        {m.upsell && <UpsellCard tier={m.upsell.tier} />}
        {!m.streaming && m.sources?.length > 0 && (
          <div className="bean-sources">
            <span>Sources</span>
            {m.sources.slice(0, 3).map((s, i) =>
              s.url ? (
                <a key={i} href={s.url} className="pill" title={decodeHtml(s.title)}>
                  {decodeHtml(s.title)}
                </a>
              ) : (
                <span key={i} className="pill">{decodeHtml(s.title)}</span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ m, avatar, initial }) {
  return (
    <div className="bean-row from-user">
      <span className="bean-av user">
        {avatar ? <img src={avatar} alt="You" /> : initial || "You"}
      </span>
      <div className="bean-stack">
        <div className="bubble">{m.text}</div>
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="bean-row bean-thinking">
      <span className="bean-av">
        <img src={BEAN.think} alt="" />
      </span>
      <div className="bean-stack">
        <div className="bubble">
          <span className="label">The Bean is digging through the feeds</span>
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BeanChat({ variant = "page", onClose }) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [msgs, setMsgs] = useState([]); // {role:'user'|'bean', text, sources?, pose?, card?, streaming?}
  const [thinking, setThinking] = useState(false);
  const [val, setVal] = useState("");
  const [quota, setQuota] = useState(null); // { remaining, cap, tier } once metering is live
  const taRef = useRef(null);
  const scrollRef = useRef(null); // internal scroll container (page + widget)
  const answerCount = useRef(0);
  const started = msgs.length > 0;
  const busy = thinking || msgs[msgs.length - 1]?.streaming;
  const userAvatar = user?.avatar || user?.user_avatar || "";
  const userInitial = (user?.user_display_name || user?.display_name || user?.name || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    if (msgs.length === 0) return; // don't scroll the welcome screen out of view
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [msgs, thinking]);

  const ask = useCallback(
    async (text) => {
      const q = (text || "").trim();
      if (!q || busy) return;
      if (!user) {
        openLogin();
        return;
      }

      const history = msgs.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      setVal("");
      if (taRef.current) taRef.current.style.height = "auto";
      setMsgs((m) => [...m, { role: "user", text: q }]);
      setThinking(true);

      const pose = ANSWER_POSES[answerCount.current++ % ANSWER_POSES.length];
      const ensureBean = (patch) =>
        setMsgs((m) => {
          const c = [...m];
          if (c[c.length - 1]?.role !== "bean") {
            c.push({ role: "bean", text: "", sources: [], pose, streaming: true });
          }
          c[c.length - 1] = { ...c[c.length - 1], ...patch(c[c.length - 1]) };
          return c;
        });

      await streamBeanChat(q, history, {
        onSources: (sources) => {
          setThinking(false);
          ensureBean((b) => ({ sources }));
        },
        onCard: (card) => {
          setThinking(false);
          // Mood: when the Bean has the receipts (a data card), he's confident.
          ensureBean((b) => ({ card, pose: BEAN.thumb }));
        },
        onCapped: (e) => {
          setThinking(false);
          ensureBean((b) => ({ upsell: { tier: e.tier } }));
        },
        onQuota: (e) => setQuota({ remaining: e.remaining, cap: e.cap, tier: e.tier }),
        onDelta: (t) => {
          setThinking(false);
          ensureBean((b) => ({ text: b.text + t }));
        },
        onError: (message) => {
          setThinking(false);
          ensureBean((b) => ({ text: message, streaming: false }));
        },
      });

      setMsgs((m) => {
        const c = [...m];
        if (c[c.length - 1]?.role === "bean") c[c.length - 1] = { ...c[c.length - 1], streaming: false };
        return c;
      });
    },
    [busy, user, msgs, openLogin]
  );

  function onInput(e) {
    setVal(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(120, ta.scrollHeight) + "px";
  }
  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(val);
    }
  }
  function reset() {
    setMsgs([]);
    setThinking(false);
    setVal("");
    answerCount.current = 0;
  }

  const composer = (
    <div>
      {user ? (
        <div className="bean-composer">
          <div className="bean-inputwrap">
            <textarea
              ref={taRef}
              rows="1"
              value={val}
              placeholder="Talk to Steve about anything Big Brother…"
              onChange={onInput}
              onKeyDown={onKey}
              aria-label="Message Steve Beans"
            />
          </div>
          <button className="bean-send" onClick={() => ask(val)} disabled={!val.trim() || busy} aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      ) : (
        <button className="bean-gate" onClick={openLogin}>
          Log in to chat with Steve
        </button>
      )}
      {quota?.remaining != null && (
        <div className="bean-quota">
          <b>{quota.remaining}</b> message{quota.remaining === 1 ? "" : "s"} left today
          {quota.remaining <= 2 && quota.tier !== "full_bean" && (
            <>
              {" · "}
              <a href={UPGRADE_URL}>want more?</a>
            </>
          )}
        </div>
      )}
      <div className="composer-note">
        The Bean can be wrong, he&rsquo;s a very confident legume. <b>Double-check the big stuff.</b>
      </div>
    </div>
  );

  const welcome = (
    <div className="bean-hero">
      <div className="mascot">
        <img src={BEAN.wave} alt="Ask the Bean mascot" />
      </div>
      {variant === "page" && <span className="eyebrow">An AI version of Steve</span>}
      <h1>
        Ask the <span className="b">Bean</span>
      </h1>
      <p className="dek">
        Chat Big Brother with an AI version of me. Spicy takes, deep house history, real player stats. Opinions are mine,
        facts come from the archive, never made up. Pull up a chair.
      </p>
      <div className="suggest">
        <div className="sh">Try asking</div>
        <div className="suggest-grid">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="qcard" onClick={() => ask(s.q)}>
              <span className={"tag " + s.cls}>{s.tag}</span>
              <span>
                <span className="qt">{s.qt}</span>
                <span className="qs">{s.qs}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const thread = (
    <div className="bean-thread">
      {msgs.map((m, i) =>
        m.role === "user" ? (
          <UserRow key={i} m={m} avatar={userAvatar} initial={userInitial} />
        ) : (
          <BeanRow key={i} m={m} />
        )
      )}
      {thinking && <ThinkingRow />}
    </div>
  );

  // ---- Docked widget (floating launcher) ----
  if (variant === "widget") {
    return (
      <>
        <div className="bw-head">
          <span className="av">
            <img src={BEAN.wave} alt="" />
          </span>
          <div className="ttl">
            <b>Steve Beans</b>
            <small>Online · AI</small>
          </div>
          <button className="x" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="bw-body" ref={scrollRef}>
          {!started ? welcome : thread}
        </div>
        <div className="bw-foot">{composer}</div>
      </>
    );
  }

  // ---- Full page ----
  return (
    <div className="bean-app is-page" data-accent="blue">
      <div className="bean-cap">
        <span className="badge">
          <span className="d" />
          The Bean is online
        </span>
        <span className="hidden sm:inline">An AI re-creation of Steve Beans</span>
        <span className="spacer" />
        <span className="hidden sm:inline">Beta</span>
      </div>

      <div className="bean-scroll" ref={scrollRef}>
        <div className="bean-page">
          {!started ? (
            welcome
          ) : (
            <div className="bean-convo">
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button className="bean-reset" onClick={reset} disabled={busy}>
                  ↺ New chat
                </button>
              </div>
              {thread}
            </div>
          )}
        </div>
      </div>

      <div className="bean-composer-dock">
        <div className="bean-page">{composer}</div>
      </div>
    </div>
  );
}
