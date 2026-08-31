"use client";

import { FormField, FormSection } from "@/components/forms";

/**
 * Inclusive day count, matching the API's convention everywhere on the site
 * (premiere = Day 1, so July 7 -> Oct 1 is 87, not 86). Returns "" until both
 * dates are set and valid.
 */
function totalDaysBetween(start, end) {
  if (!start || !end) return "";
  const ms = new Date(end) - new Date(start);
  if (Number.isNaN(ms) || ms < 0) return "";
  return Math.round(ms / 86400000) + 1;
}

/**
 * Season dates: start, end, auto-calculated total days
 */
export function DatesSection({ values, errors, getFieldProps }) {
  return (
    <FormSection
      title="Dates"
      description="Season timeline for progress tracking and display."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Start Date"
          type="date"
          error={errors.start_date}
          {...getFieldProps("start_date")}
        />

        <FormField
          label="End Date"
          type="date"
          error={errors.end_date}
          {...getFieldProps("end_date")}
        />

        {/* Display-only: every API response derives total_days from the
            dates (inclusive), so this field is never stored or submitted. */}
        <FormField
          label="Total Days"
          type="number"
          name="total_days_display"
          value={totalDaysBetween(values.start_date, values.end_date)}
          onChange={() => {}}
          disabled
          placeholder="—"
          helpText="Auto-calculated: premiere = Day 1"
        />
      </div>
    </FormSection>
  );
}
