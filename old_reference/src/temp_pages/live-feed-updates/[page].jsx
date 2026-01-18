import React, { useState } from "react";
import FeedUpdateBox from "@/components/sub-components/FeedUpdateBox";
import FeedUpdates from "@/components/FeedUpdates";
import useSWR from "swr";
import Spinner from "@/components/Spinner";
import Pagination from "@/components/sub-components/Pagination";
import Link from "next/link";

const fetcher = url => fetch(url).then(res => res.json());

const POSTS_PER_PAGE = 40;

const FeedListings = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const fetchURL = `${process.env.NEXT_PUBLIC_API_CUSTOM}feed_updates?per_page=${POSTS_PER_PAGE}&offset=20`;

  const { data, error, isValidating } = useSWR(fetchURL, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    refreshInterval: 100000
  });

  if (error) return <p>Error: {error}</p>;
  if (!data) return <Spinner />;

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // console.log("FEED PAGE DATA");
  // console.log(data);

  const totalPages = Math.ceil(data.total_count / POSTS_PER_PAGE);

  return (
    <div className="w-full flex flex-col">
      {data.feed_updates.map(node => (
        <FeedUpdateBox node={node} key={node.ID} />
      ))}
    </div>
  );
};

export default FeedListings;
