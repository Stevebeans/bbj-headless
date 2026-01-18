"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const MobileNav = () => {
  const { user, logout } = useAuth();

  const pathName = usePathname();
  return (
    <div className="md:hidden absolute top-full left-0 w-full bg-slate-100 p-4 z-50 border-t-2 border-b-2 border-primary500 flex flex-col items-end">
      <div className="mobile-nav-button text-lg">
        <Link href="/" className={pathName == "/" && "active"}>
          Home
        </Link>
      </div>
      {user ? (
        <>
          <div className="mobile-nav-button text-lg">
            <Link href="/dashboard" className={pathName == "/dashboard" && "active"}>
              Dashboard
            </Link>
          </div>
          <div className="mobile-nav-button text-lg">
            <button
              onClick={() => {
                logout();
                toggleMobileMenu();
              }}
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="nav-button">
          <Link href="/bbjlogin" className={pathName == "/bbjlogin" && "active"}>
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
