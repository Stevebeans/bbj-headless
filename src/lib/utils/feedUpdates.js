/**
 * Get Tailwind color classes for vote total display
 * @param {number} total - The vote total
 * @returns {string} Tailwind color classes
 */
export function getVoteTotalColor(total) {
  if (total > 0) return "text-green-600 dark:text-green-400";
  if (total < 0) return "text-red-600 dark:text-red-400";
  return "text-gray-500";
}
