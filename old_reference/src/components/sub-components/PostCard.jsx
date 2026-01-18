import React from "react";
import Image from "next/image";
import BeansTimeAgo from "./TimeAgo";

const PostCard = ({ post }) => {
  const date = new Date(post.post_modified);

  return (
    <div className="flex border-b border-slate-500 mb-4">
      <div className="w-[250px]">
        <Image src={post?.thumbnail_url} alt={post.title} width={250} height={150} className="h-[150px] w-[250px]" />
      </div>
      <div className="w-full p-2">
        <div className="flex justify-between font-ibm text-sm text-gray-500">
          <div className="text-left">Category</div>
          <div className="text-right">
            <BeansTimeAgo date={date} locale="en-US" />
          </div>
        </div>

        <div className="font-primaryHeader text-2xl">{post.title}</div>
        <div dangerouslySetInnerHTML={{ __html: post.post_content }} className="text-sm" />

        <div className="flex justify-between font-ibm text-sm text-gray-500">
          <div className="text-left">{/* {post?.author?.node?.name} */}</div>
          <div className="text-right">{/* {post.commentCount} {post.commentCount > 1 ? "Comments" : "Comment"} */}</div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
