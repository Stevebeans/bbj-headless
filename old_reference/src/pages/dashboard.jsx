// src/pages/dashboard.jsx

import withAuth from "@/hoc/withAuth";
import UserInfo from "@/components/UserInfo";

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <UserInfo />
    </div>
  );
};

export default withAuth(Dashboard);
