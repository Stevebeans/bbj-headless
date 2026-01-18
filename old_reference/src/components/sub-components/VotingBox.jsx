import React from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";

const VotingBox = ({ node }) => {
  return (
    <div className="p-2 bg-gray-200 flex flex-col w-10 rounded-b-md rounded-tl-md">
      <div className="hover:cursor-pointer flex items-center justify-center">
        <FaChevronUp />
      </div>
      <div className="text-center font-ibm text-lg">3</div>
      <div className="hover:cursor-pointer flex items-center justify-center">
        <FaChevronDown />
      </div>
    </div>
  );
};

export default VotingBox;
