import React from "react";
import Image from "next/image";
import BeansTimeAgo from "../TimeAgo";

/* <div className="">
      <div className="p-2 mb-2 rounded-md flex items-center">
        <div className=" w-12 h-12 p-1 border rounded-full self-start">
          <Image src={reply.comment_author_avatar} alt={reply.comment_author} height={40} width={40} className="rounded-full w-full h-full" />
        </div>
        <div className="ml-2 flex flex-col justify-center  w-full ">
          <div className="text-xs text-secondary500">
            <BeansTimeAgo date={reply.comment_date} />
          </div>
          <div className="font-semibold border-b border-gray-300 pb-1 mb-2">{reply.comment_author}</div>
          <div dangerouslySetInnerHTML={{ __html: reply.comment_content }} />
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="ml-10">
          {comment.replies.map(reply => (
            <CommentReplyCard comment={reply} key={reply.comment_ID} />
          ))}
        </div>
      )}
    </div>
    */

const CommentReplyCard = ({ comment }) => {
  //console.log("reply", comment);
  return (
    <div className="ml-10">
      <div className="p-2 mb-2 rounded-md flex items-center">
        <div className=" w-12 h-12 p-1 border rounded-full self-start">{comment.comment_author_avatar && <Image src={comment.comment_author_avatar} alt={comment.comment_author} height={40} width={40} className="rounded-full w-full h-full" />}</div>
        <div className="ml-2 flex flex-col justify-center  w-full ">
          <div className="text-xs text-secondary500">
            <BeansTimeAgo date={comment.comment_date} />
          </div>
          <div className="font-semibold border-b border-gray-300 pb-1 mb-2">{comment.comment_author}</div>
          <div dangerouslySetInnerHTML={{ __html: comment.comment_content }} />
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="ml-10">
          {comment.replies.map(reply => (
            <CommentReplyCard comment={reply} key={reply.comment_ID} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentReplyCard;
