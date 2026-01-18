"use client";

import { FormField, FormSection } from "@/components/forms";

/**
 * Basic season info: name, number, abbreviation, status
 */
export function BasicInfoSection({ values, errors, getFieldProps }) {
  const statusOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "current", label: "Current (Now Airing)" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <FormSection
      title="Basic Information"
      description="Core season details displayed throughout the site."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Season Name"
          required
          error={errors.name}
          {...getFieldProps("name")}
          placeholder="Big Brother 27"
        />

        <FormField
          label="Season Number"
          type="number"
          required
          error={errors.season_number}
          {...getFieldProps("season_number")}
          placeholder="27"
        />

        <FormField
          label="Abbreviation"
          error={errors.abbreviation}
          {...getFieldProps("abbreviation")}
          placeholder="BB27"
          helpText="Short code used for display (e.g., BB27)"
        />

        <FormField
          label="Status"
          as="select"
          error={errors.status}
          {...getFieldProps("status")}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormField>
      </div>
    </FormSection>
  );
}
