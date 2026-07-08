import Link from "next/link";

// "Hot This Week" ranked list — injected into the shared Sidebar. Server component.
export function FeedHubHotPosts({ hotPosts }) {
  if (!hotPosts?.length) return null;
  return (
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
  );
}
