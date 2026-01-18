import React from "react";
import Image from "next/image";
import BeansTimeAgo from "@/components/utils/TimeAgo";
import Link from "next/link";
import { commentConversion } from "@/utils/commentFormat";
import SubHeader from "@/components/utils/SubHeader";

const MainPostCard = props => {
  const post = props.first_post;
  const date = new Date(post.post_date);

  //const excerpt = convertExcerpt(post.post_content, 75);

  // trim post.post_content to the first 30 word

  return (
    <section>
      <div className="flex flex-grow p-0 md:p-2 flex-col " id="main-feeds">
        <div className="p-2">
          <SubHeader title="Latest Post" />
        </div>
        <div className="w-full bg-neutral-100 shadow-frontBox flex flex-col md:flex-row p-0 md:p-2">
          <div className="shrink-0 w-full md:w-[350px] h-fit">
            {post.slug ? (
              <Link href={post.slug}>
                <Image src={post?.thumbnail_url} alt={post.title} priority={true} width={350} height={225} sizes="(min-width: 768px) 350px" className="md:rounded-md object-cover w-full md:w-[350px]" />
              </Link>
            ) : (
              <Image src={post?.thumbnail_url} alt={post.title} priority={true} width={350} height={225} sizes="(min-width: 768px) 350px" className="md:rounded-md object-cover w-full md:w-[350px]" />
            )}
          </div>
          <div className="flex flex-col h-full p-2 md:px-2">
            <h2 className="font-primaryHeader text-2xl font-bold mt-2 md:mt-0">{post.slug ? <Link href={post.slug}>{post.post_title}</Link> : <span>{post.post_title}</span>}</h2>
            <div className="font-ibm text-sm">{date && <BeansTimeAgo date={date} locale="en-US" />}</div>
            <div></div>
            <div className="flex justify-between font-ibm py-2 text-sm mt-2 border-t border-slate-300">
              <div className="flex items-center">
                By: {post.author_avatar && <Image src={post.author_avatar} height={18} width={18} className="mx-2 rounded-full h-[18px] w-[18px]" />} {post.author_name}
              </div>
              <div>{commentConversion(post.comment_count)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainPostCard;
