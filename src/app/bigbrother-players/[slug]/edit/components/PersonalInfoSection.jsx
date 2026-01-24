"use client";

import { FormSection, FormField } from "@/components/forms";

/**
 * Personal info section: Occupation
 */
export function PersonalInfoSection({ values, errors, onChange, onBlur, getFieldProps }) {
  return (
    <FormSection
      title="Personal Information"
      description="Occupation and other personal details."
    >
      <FormField
        label="Occupation"
        placeholder="e.g., Teacher, Nurse, Firefighter"
        {...getFieldProps("occupation")}
      />
    </FormSection>
  );
}
