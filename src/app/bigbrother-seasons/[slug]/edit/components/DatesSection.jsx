"use client";

import { FormField, FormSection } from "@/components/forms";

/**
 * Season dates: start, end, total days
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

        <FormField
          label="Total Days"
          type="number"
          error={errors.total_days}
          {...getFieldProps("total_days")}
          placeholder="99"
          helpText="Expected season length"
        />
      </div>
    </FormSection>
  );
}
