"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "./NavBar";
import MobileNav from "./MobileNav";

const HeaderInside = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white relative">
      <div className="flex items-center justify-between relative z-10  p-1  py-1 px-1 border-b-2 border-primary500">
        <Link href="/">
          <Image
            src="/images/mainlogo.jpg"
            alt="Big Brother Junkies - Live Feed Spoilers"
            width={395}
            height={37}
            stlye={{
              width: "100%",
              height: "auto"
            }}
          />
        </Link>
        <NavBar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>
      {isMobileMenuOpen && <MobileNav isMobileMenuOpen={isMobileMenuOpen} />}
    </div>
  );
};

export default HeaderInside;
