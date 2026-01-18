import React, { useEffect, useState } from "react";

const BeansTimeAgo = ({ date, locale }) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

      const then = new Date(date);

      const secondsAgo = Math.floor((now - then) / 1000);

      let interval = secondsAgo / 31536000; // 1 year
      if (interval >= 1) {
        const years = Math.floor(interval);
        return `${years} year${years !== 1 ? "s" : ""} ago`;
      }
      interval = secondsAgo / 2592000; // 1 month
      if (interval >= 1) {
        const months = Math.floor(interval);
        return `${months} month${months !== 1 ? "s" : ""} ago`;
      }
      interval = secondsAgo / 86400; // 1 day
      if (interval >= 1) {
        const days = Math.floor(interval);
        return `${days} day${days !== 1 ? "s" : ""} ago`;
      }
      interval = secondsAgo / 3600; // 1 hour
      if (interval >= 1) {
        const hours = Math.floor(interval);
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      }
      interval = secondsAgo / 60; // 1 minute
      if (interval >= 1) {
        const minutes = Math.floor(interval);
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      }
      return `${secondsAgo} second${secondsAgo !== 1 ? "s" : ""} ago`;
    };

    setTimeAgo(calculateTimeAgo());

    const intervalId = setInterval(() => {
      setTimeAgo(calculateTimeAgo());
    }, 60000); // update every minute

    return () => clearInterval(intervalId);
  }, [date]);

  return <div>{timeAgo}</div>;
};

export default BeansTimeAgo;
