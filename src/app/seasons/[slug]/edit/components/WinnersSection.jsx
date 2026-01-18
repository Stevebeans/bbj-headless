"use client";

import { FormSection } from "@/components/forms";

/**
 * Season winners: winner, runner-up, AFP
 */
export function WinnersSection({ values, errors, setValue, players }) {
  const playerOptions = [
    { value: "", label: "Not set" },
    ...players.map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ];

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value ? parseInt(value, 10) : "");
  };

  return (
    <FormSection
      title="Season Results"
      description="Select winner, runner-up, and America's Favorite Player once the season is complete."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Winner */}
        <div className="space-y-1.5">
          <label
            htmlFor="winner_id"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Winner
          </label>
          <select
            id="winner_id"
            name="winner_id"
            value={values.winner_id || ""}
            onChange={handleSelectChange}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {playerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.winner_id && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.winner_id}</p>
          )}
        </div>

        {/* Runner-up */}
        <div className="space-y-1.5">
          <label
            htmlFor="runner_up_id"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Runner-up
          </label>
          <select
            id="runner_up_id"
            name="runner_up_id"
            value={values.runner_up_id || ""}
            onChange={handleSelectChange}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {playerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.runner_up_id && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.runner_up_id}</p>
          )}
        </div>

        {/* AFP */}
        <div className="space-y-1.5">
          <label
            htmlFor="afp_id"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            America&apos;s Favorite Player
          </label>
          <select
            id="afp_id"
            name="afp_id"
            value={values.afp_id || ""}
            onChange={handleSelectChange}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {playerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.afp_id && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.afp_id}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}
