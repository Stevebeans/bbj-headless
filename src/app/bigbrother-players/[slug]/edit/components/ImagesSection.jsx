"use client";

import { FormSection } from "@/components/forms";
import { ImageUpload } from "@/components/forms";

/**
 * Images section: Profile picture and banner
 */
export function ImagesSection({ values, errors, setValue, player }) {
  const handleImageChange = (name, url, error) => {
    if (error) {
      console.error(`Image error for ${name}:`, error);
      return;
    }
    setValue(name, url || "");
  };

  return (
    <FormSection
      title="Images"
      description="Profile picture and banner image."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Picture
          </label>
          <ImageUpload
            value={player.photo?.url || ""}
            onChange={(url, error) => handleImageChange("profile_picture", url, error)}
            aspectRatio="1:1"
            helpText="375×375px recommended"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Banner Image
          </label>
          <ImageUpload
            value={player.banner?.url || ""}
            onChange={(url, error) => handleImageChange("player_banner", url, error)}
            aspectRatio="3.4:1"
            helpText="1200×350px recommended"
          />
        </div>
      </div>
    </FormSection>
  );
}
