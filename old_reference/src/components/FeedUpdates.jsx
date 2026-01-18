import React, { useState } from "react";
import FeedUpdateBox from "@/components/sub-components/FeedUpdateBox";
import Spinner from "@/components/Spinner"; // Ensure the path is correct
import Link from "next/link";

const POSTS_PER_PAGE = 20;

const FeedUpdates = ({ feed_updates }) => {
  // const router = useRouter();
  // const [page, setPage] = useState(currentPage);
  const data = feed_updates;

  //console.log("DATA", data);
  if (!data) {
    console.error("Invalid or no data received", data);
    return <Spinner />;
  }

  return (
    <div className="w-full flex flex-col">
      {data.map(node => (
        <FeedUpdateBox node={node} key={node.ID} />
      ))}
      <div className="flex items-center justify-center">
        {/* <Link href={`/live-feed-updates/${page + 1}`}>
          <button className="btn">View All Feed Updates</button>
        </Link> */}
      </div>
    </div>
  );
};

export default FeedUpdates;
