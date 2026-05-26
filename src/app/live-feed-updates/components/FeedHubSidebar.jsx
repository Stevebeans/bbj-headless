import Link from "next/link";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { StickyAdSlot } from "@/components/sidebar/StickyAdSlot";

const PARAMOUNT_URL = "https://paramountplus.qflm.net/c/161260/3116112/3065";

const SOCIALS = [
  { label: "𝕏", href: "https://x.com/bbjunkies", title: "X" },
  { label: "IG", href: "https://instagram.com/bigbrotherjunkies", title: "Instagram" },
  { label: "FB", href: "https://facebook.com/bigbrotherjunkies", title: "Facebook" },
  { label: "BS", href: "https://bsky.app/profile/bigbrotherjunkies.com", title: "Bluesky" },
];

export function FeedHubSidebar({ houseboard, hotPosts }) {
  const hoh = houseboard?.hoh?.[0]?.name || "—";
  const veto = houseboard?.pov?.[0]?.name || "—";
  const block = (houseboard?.nominees || []).map((n) => n.name).slice(0, 3).join(" · ") || "—";

  return (
    <aside>
      <div className="fuh-stick">
        <div className="fuh-card fuh-live-mini">
          <h4>Live Right Now</h4>
          <div className="fuh-row"><span className="fuh-k">HoH</span><span className="fuh-v">{hoh}</span></div>
          <div className="fuh-row"><span className="fuh-k">Veto</span><span className="fuh-v">{veto}</span></div>
          <div className="fuh-row"><span className="fuh-k">Block</span><span className="fuh-v">{block}</span></div>
          <div className="fuh-row"><span className="fuh-k">Next evict</span><span className="fuh-v">Thursday</span></div>
          <a className="fuh-cta" href={PARAMOUNT_URL} rel="nofollow noopener" target="_blank">Watch on Paramount+ →</a>
        </div>

        <div className="fuh-card fuh-follow">
          <h4>Follow Us</h4>
          <div className="fuh-socials">
            {SOCIALS.map((s) => (
              <a key={s.title} href={s.href} rel="nofollow noopener" target="_blank" title={s.title}>{s.label}</a>
            ))}
          </div>
        </div>

        <SubscribeWidget />

        {hotPosts?.length > 0 && (
          <div className="fuh-card fuh-hotposts">
            <h4>Hot This Week</h4>
            <ol>
              {hotPosts.map((hp) => (
                <li key={hp.id}>
                  <div>
                    <h5><Link href={`/${hp.slug}`}>{hp.title}</Link></h5>
                    <div className="fuh-m">{hp.comment_count} comments · {hp.time_ago}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <StickyAdSlot />
      </div>
    </aside>
  );
}
