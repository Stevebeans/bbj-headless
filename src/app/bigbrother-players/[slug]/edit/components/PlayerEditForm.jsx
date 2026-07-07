"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard, SaveBar } from "@/components/admin";
import { useFormState } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { updatePlayer } from "@/lib/api/players";
import { BasicInfoSection } from "./BasicInfoSection";
import { LocationSection } from "./LocationSection";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { ImagesSection } from "./ImagesSection";
import { SocialSection } from "./SocialSection";
import { BioSection } from "./BioSection";
import { SeasonsSection } from "./SeasonsSection";

/**
 * Player edit form with all sections
 */
export function PlayerEditForm({ player, slug }) {
  const router = useRouter();
  const { user } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form initial values
  const initialValues = {
    first_name: player.first_name || "",
    last_name: player.last_name || "",
    official_nickname: player.nickname || "",
    player_gender: player.gender || "",
    date_of_birth: player.date_of_birth || "",
    occupation: player.occupation || "",
    locality: player.city || "",
    administrative_area_level_1: player.state || "",
    lat: "",
    lng: "",
    profile_picture: player.photo?.id || "",
    player_banner: player.banner?.id || "",
    twitter: player.social?.twitter || "",
    instagram: player.social?.instagram || "",
    facebook: player.social?.facebook || "",
    tiktok: player.social?.tiktok || "",
    bio: stripHtml(player.bio) || "",
  };

  // Validation
  const validate = useCallback((values) => {
    const errors = {};
    if (!values.first_name?.trim()) errors.first_name = "First name is required";
    if (!values.last_name?.trim()) errors.last_name = "Last name is required";
    return errors;
  }, []);

  // Submit handler
  const handleFormSubmit = useCallback(async (values) => {
    // Never send an empty image field for a player who HAS that image —
    // the endpoint treats empty as "clear it". Covers deploy skew where the
    // API response lacks photo/banner ids.
    const payload = { ...values };
    if (!payload.profile_picture && player.photo?.url) delete payload.profile_picture;
    if (!payload.player_banner && player.banner?.url) delete payload.player_banner;

    const result = await updatePlayer(player.id, payload, user?.token);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    }
    return result;
  }, [player.id, player.photo?.url, player.banner?.url, user?.token, router]);

  const {
    values,
    errors,
    isDirty,
    isSubmitting,
    submitError,
    setValue,
    handleChange,
    handleBlur,
    reset,
    handleSubmit,
    getFieldProps,
  } = useFormState(initialValues, {
    validate,
    onSubmit: handleFormSubmit,
  });

  return (
    <AdminGuard>
      <div className="pb-24">
        {/* Success message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 dark:text-green-200">Player saved successfully!</span>
          </div>
        )}

        {/* Form sections */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection
            values={values}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            getFieldProps={getFieldProps}
          />

          <PersonalInfoSection
            values={values}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            getFieldProps={getFieldProps}
          />

          <LocationSection
            values={values}
            errors={errors}
            setValue={setValue}
            onChange={handleChange}
            onBlur={handleBlur}
            getFieldProps={getFieldProps}
          />

          <ImagesSection
            values={values}
            errors={errors}
            setValue={setValue}
            player={player}
          />

          <SocialSection
            values={values}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            getFieldProps={getFieldProps}
          />

          <BioSection
            values={values}
            errors={errors}
            setValue={setValue}
          />

          <SeasonsSection
            seasons={player.seasons || []}
          />
        </form>

        {/* Save bar */}
        <SaveBar
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          onSave={handleSubmit}
          onCancel={() => reset()}
          error={submitError}
        />
      </div>
    </AdminGuard>
  );
}

/**
 * Extract attachment ID from URL (placeholder - images stored as attachment IDs)
 */
/**
 * Strip HTML tags for plain text bio editing
 */
function stripHtml(html) {
  if (!html) return "";
  // Simple strip - works for basic HTML
  return html.replace(/<[^>]*>/g, "").trim();
}
