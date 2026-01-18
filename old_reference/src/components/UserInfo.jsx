// src/components/UserInfo.jsx

import React from "react";
import { useAuth } from "@/context/AuthContext";

const UserInfo = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>No user is logged in.</div>;
  }

  return (
    <div>
      <h2>Logged in as:</h2>
      <p>Email: {user.user_email}</p>
      <p>Username: {user.user_nicename}</p>
      <p>Display Name: {user.user_display_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default UserInfo;
