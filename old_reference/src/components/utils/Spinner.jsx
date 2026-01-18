"use client";

import React from "react";
import { useState } from "react";
import { BounceLoader } from "react-spinners";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red"
};

const Spinner = ({ text }) => {
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#35546e");

  return (
    <div className="flex flex-col items-center justify-center">
      <BounceLoader color={color} loading={loading} css={override} size={25} />
      <div className="text-lg font-semibold text-primary500">Loading {text}...</div>
    </div>
  );
};

export default Spinner;
