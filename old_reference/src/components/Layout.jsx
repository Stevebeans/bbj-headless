import React from "react";
import SideBar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <React.Fragment>
      <Header />
      <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto shadow bg-white mt-2 ">
        <main className="p-0 md:p-2 grow">{children}</main>
        <SideBar />
      </div>
    </React.Fragment>
  );
};

export default Layout;
