// components/TimeAgo.js
import { formatDistanceToNow } from "date-fns";

const TimeAgo = ({ date }) => {
  return <time dateTime={date}>{formatDistanceToNow(new Date(date), { addSuffix: true })}</time>;
};

export default TimeAgo;
