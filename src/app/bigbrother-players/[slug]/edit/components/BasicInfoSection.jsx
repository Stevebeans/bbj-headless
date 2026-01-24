"use client";

import { FormSection, FormField } from "@/components/forms";

/**
 * Basic info section: First name, Last name, Nickname, Gender, DOB
 */
export function BasicInfoSection({ values, errors, onChange, onBlur, getFieldProps }) {
  return (
    <FormSection
      title="Basic Information"
      description="Player name and personal details."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="First Name"
          required
          {...getFieldProps("first_name")}
        />

        <FormField
          label="Last Name"
          required
          {...getFieldProps("last_name")}
        />

        <FormField
          label="Nickname"
          placeholder='e.g., "The Funeral Director"'
          {...getFieldProps("official_nickname")}
        />

        <FormField
          label="Gender"
          as="select"
          {...getFieldProps("player_gender")}
        >
          <option value="">Select gender...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </FormField>

        <FormField
          label="Date of Birth"
          type="date"
          {...getFieldProps("date_of_birth")}
        />
      </div>
    </FormSection>
  );
}
