"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { isAdmin } from "@/utils/userUtils";
import Search from "./Search";
import { FaBars, FaX } from "react-icons/fa6";

const NavBar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const pathName = usePathname();

  return (
    <div className="">
      {/* Desktop Section */}
      <nav className="grow font-bold text-lg justify-end hidden md:flex">
        <Search />
        <div className="nav-button">
          <Link href="/" className={pathName == "/" ? "active" : undefined}>
            Home
          </Link>
        </div>
        <div className="nav-button">
          <Link href="/bigbrother-players" className={pathName == "/bigbrother-players" ? "active" : undefined}>
            All Players
          </Link>
        </div>
        {user ? (
          <>
            <div className="nav-button">
              <Link href="/dashboard" className={pathName == "/dashboard" ? "active" : undefined}>
                Dashboard
              </Link>
            </div>
            <div className="nav-button">
              <button onClick={logout}>Logout</button>
            </div>
            <div className="self-center border-2 rounded-full p-0.5 border-primary500 h-8 w-8">{user.user_avatar && <Image src={user.user_avatar} alt={user.user_display_name} width={50} height={50} className="rounded-full h-full w-full" />}</div>
          </>
        ) : (
          <>
            <div className="nav-button">
              <Link href="/bbjlogin" className={pathName == "/bbjlogin" ? "active" : undefined}>
                Login
              </Link>
            </div>
            <div className="nav-button">
              <Link href="/bbjregister" className={pathName == "/bbjregister" ? "active" : undefined}>
                Register
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Mobile Section */}
      <nav className="md:hidden flex items-center justify-between p-2">
        <div className="flex items-center">
          <button onClick={toggleMobileMenu}>{isMobileMenuOpen ? <FaX className="text-xl" /> : <FaBars className="text-xl" />}</button>
        </div>
        {user && (
          <div className="w-[25px] h-[25px] ml-2">
            <Link href="/dashboard">{user.user_avatar && <Image src={user.user_avatar} alt={user.user_display_name} width={50} height={50} className="rounded-full h-full w-full" />}</Link>
          </div>
        )}
      </nav>
    </div>
  );
};

export default NavBar;
