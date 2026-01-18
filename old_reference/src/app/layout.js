// src/app/layout.js
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideBar from "@/components/SideBar";

const Layout = ({ children, spoilerBar }) => {
  return (
    <>
      <Header spoilerBar={spoilerBar} />
      <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto shadow bg-white mt-2 ">
        <main className="p-0 md:p-2 grow">{children}</main>
        <SideBar />
      </div>
      <Footer />
    </>
  );
};

export default Layout;
