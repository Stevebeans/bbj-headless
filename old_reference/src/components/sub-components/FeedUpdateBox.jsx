import React from "react";
import VotingBox from "./VotingBox";
import Image from "next/image";
import Link from "next/link";
import BeansTimeAgo from "./TimeAgo";

const FeedUpdateBox = ({ node }) => {
  const date = new Date(node.post_modified);

  return (
    <div className="p-1  border-sky-600 hover:bg-slate-200 border flex rounded-md  relative mb-4">
      <VotingBox />
      <div className="w-full flex flex-col">
        <div className="bg-gray-200 p-1 flex justify-between ">
          <div className="font-ibm text-sm flex-shrink-0 flex min-w-fit items-center">
            {node.author_name} <span className="font-ibm ml-2 text-xs">{date && <BeansTimeAgo date={date} locale="en-US" />}</span>
          </div>
        </div>

        <div className="flex-col p-2">
          <div className="row-span-2 float-left mr-2">
            {node?.thumbnail_url && node?.page_slug && (
              <Link href={node?.page_slug}>
                <Image src={node?.thumbnail_url} alt={node.title} className="h-[100px] w-[100px] rounded" width={100} height={100} />
              </Link>
            )}
          </div>
          <div className="text-lg font-semibold">{node?.page_slug ? <Link href={node?.page_slug}>{node.post_title}</Link> : node.post_title}</div>
        </div>
      </div>
    </div>
  );
};

export default FeedUpdateBox;
