import Image from "next/image";
import Link from "next/link";

// Featured (latest) update card. Server component.
export function FeedHubFeatured({ featured }) {
  if (!featured) return null;
  const href = `/live-feed-updates/${featured.slug}`;
  const mode = featured.mode === "show" ? "Show" : "Feed";
  return (
    <div className="fuh-featured">
      <div className="fuh-ph">
        {featured.thumbnail && (
          <Image
            src={featured.thumbnail}
            alt={featured.title}
            fill
            sizes="280px"
            style={{ objectFit: "cover" }}
          />
        )}
        <span className="fuh-pill">Latest update</span>
        <span className="fuh-name">{mode} Update</span>
      </div>
      <div className="fuh-bd">
        <span className="fuh-kk"><b>Newest</b>{featured.time_ago}</span>
        <h2><Link href={href}>{featured.title}</Link></h2>
        {featured.excerpt && <p>{featured.excerpt}</p>}
        <div className="fuh-foot">
          <span>By <span className="fuh-by">{featured.author?.name}</span></span>
          <span>·</span>
          <span data-nosnippet>{featured.time_ago}</span>
          {featured.comment_count > 0 && (<><span>·</span><span>{featured.comment_count} comments</span></>)}
          <Link className="fuh-read" href={href}>Read full update →</Link>
        </div>
      </div>
    </div>
  );
}
