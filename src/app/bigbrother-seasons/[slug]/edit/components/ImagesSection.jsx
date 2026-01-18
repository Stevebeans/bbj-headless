"use client";

import { FormSection, ImageUpload } from "@/components/forms";

/**
 * Season images: banner and cover
 */
export function ImagesSection({ values, errors, setValue }) {
  // Handle image changes (ImageUpload passes name, value, error)
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
      description="Banner appears at the top of the season page. Cover image is used for social sharing and cards."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUpload
          label="Banner Image"
          name="banner_image"
          value={values.banner_image}
          onChange={handleImageChange}
          error={errors.banner_image}
          description="Recommended: 1200x400px"
        />

        <ImageUpload
          label="Cover Image"
          name="cover_image"
          value={values.cover_image}
          onChange={handleImageChange}
          error={errors.cover_image}
          description="Recommended: 1200x630px (OG image)"
        />
      </div>
    </FormSection>
  );
}
