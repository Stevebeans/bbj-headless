import React from "react";

const SubHeader = ({ title }) => {
  return (
    <div className="w-full">
      <h2 className="font-primaryHeader text-2xl text-primary500">{title}</h2>
      <div className="h-[6px] bg-secondary500 w-[100px] mb-4"></div>
    </div>
  );
};

export default SubHeader;
