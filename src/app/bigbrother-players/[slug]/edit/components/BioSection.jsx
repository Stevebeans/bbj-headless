"use client";

import { FormSection } from "@/components/forms";

/**
 * Bio section with simple textarea
 * Note: For MVP, using a simple textarea. Can be upgraded to rich text editor later.
 */
export function BioSection({ values, errors, setValue }) {
  const handleChange = (e) => {
    setValue("bio", e.target.value);
  };

  return (
    <FormSection
      title="Biography"
      description="Player biography and background information."
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <textarea
          value={values.bio || ""}
          onChange={handleChange}
          rows={8}
          className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
          placeholder="Enter player biography..."
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Plain text for now. Basic formatting will be applied when saved.
        </p>
      </div>
    </FormSection>
  );
}
