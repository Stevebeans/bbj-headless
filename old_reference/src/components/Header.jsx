import React from "react";

import SpoilerBar from "./sub-components/SpoilerBar";

import HeaderInside from "./sub-components/HeaderInside";

const Header = spoilerBar => {
  return (
    <header className="relative">
      <HeaderInside />
      <SpoilerBar spoilerBar={spoilerBar} />
    </header>
  );
};

export default Header;
