"use client";

export default function WeekEditor({ week }) {
  return (
    <p className="text-gray-500 dark:text-gray-400 text-sm py-10 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      Week {week.week_num} editor coming in the next task.
    </p>
  );
}
