import React from "react";
import Image from "next/image";
import SubPageHeaders from "@/components/sub-components/SubPageHeaders";
import BeansTimeAgo from "./sub-components/TimeAgo";
import { FaArrowDown } from "react-icons/fa6";

const Single = ({ content }) => {
  return (
    <div className="border-2 single-post">
      <div>
        <Image src={content?.page_header} alt={content.title} priority={true} width={800} height={400} sizes="(min-width: 768px) 1210px, 500px" className="md:rounded-md object-cover w-full mx-auto responsive-image" />
      </div>
      <div className="p-2 border-b border-slate-400 mb-4">
        <SubPageHeaders text={content.post_title} />
        <div className="flex justify-between pb-2 font-ibm text-gray-400">
          <div>{content.author_name}</div>
          <div>
            <BeansTimeAgo date={content.post_modified} />
          </div>
        </div>

        <div className="text-center">
          {content.comment_count > 0 ? (
            <div className="flex justify-center">
              {content.comment_count} Comments - Jump to Comments <FaArrowDown />
            </div>
          ) : (
            <div className="flex justify-center">
              0 Comments - Be The First! <FaArrowDown />
            </div>
          )}
        </div>
      </div>
      <article className="p-2">
        <div dangerouslySetInnerHTML={{ __html: content.post_content }} className="prose max-w-none" />
      </article>
    </div>
  );
};

export default Single;
