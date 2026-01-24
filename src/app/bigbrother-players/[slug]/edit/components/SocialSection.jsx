"use client";

import { FormSection, FormField } from "@/components/forms";
import { FaTwitter, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";

/**
 * Social media links section
 */
export function SocialSection({ values, errors, onChange, onBlur, getFieldProps }) {
  return (
    <FormSection
      title="Social Media"
      description="Links to player's social media profiles."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <FormField
            label="Twitter/X"
            placeholder="https://twitter.com/username"
            {...getFieldProps("twitter")}
          />
        </div>

        <div className="relative">
          <FormField
            label="Instagram"
            placeholder="https://instagram.com/username"
            {...getFieldProps("instagram")}
          />
        </div>

        <div className="relative">
          <FormField
            label="Facebook"
            placeholder="https://facebook.com/username"
            {...getFieldProps("facebook")}
          />
        </div>

        <div className="relative">
          <FormField
            label="TikTok"
            placeholder="https://tiktok.com/@username"
            {...getFieldProps("tiktok")}
          />
        </div>
      </div>
    </FormSection>
  );
}
