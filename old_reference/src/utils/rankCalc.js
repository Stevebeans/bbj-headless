import { FaCrown, FaMedal, FaGem } from "react-icons/fa6";

export const rankCalc = rank => {
  // go through each rank and return the appropriate icon
  switch (rank) {
    case "Big Boss":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-secondary300 text-orange-600 ring-offset-1 ring-2 ring-orange-400">
          <FaCrown className="mr-2" />
          Big Boss
        </div>
      );
    case "Admin":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-red-500 text-red-50">
          <FaCrown className="mr-2" />
          Admin
        </div>
      );
    case "Bronze Contributor":
      return (
        <div className="badge flex items-center space-x-2 text-xs text-orange-400">
          <FaMedal className="mr-2" />
          Bronze
        </div>
      );
    case "Silver Contributor":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-cyan-600 text-cyan-50">
          <FaMedal className="mr-2 text-cyan-100" />
          Silver
        </div>
      );
    case "Gold Contributor":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-yellow-400 text-yellow-800">
          <FaMedal className="mr-2 " />
          Gold
        </div>
      );
    case "Platinum Contributor":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-purple-500 text-purple-50">
          <FaGem className="mr-2" />
          Platinum
        </div>
      );
    case "Diamond Contributor":
      return (
        <div className="badge flex items-center space-x-2 text-xs bg-teal-600 text-teal-50 ring-2 ring-teal-400 ring-offset-1">
          <FaGem className="mr-2 " />
          Diamond
        </div>
      );

    default:
      return null;
  }
};

export const rankColors = rank => {
  switch (rank) {
    case "Bronze Contributor":
      return "orange-400";
    case "Silver Contributor":
      return "green-500";
    case "user":
      return "gray-500";
    default:
      return "gray-500";
  }
};
