"use client";

import { FormSection } from "@/components/forms";
import { PlayerImageUpload } from "./PlayerImageUpload";

/**
 * Images section: profile picture (cropped square) and banner.
 * Uploads land in the WP media library; the form stores the attachment ID,
 * which is what the update endpoint's profile_picture/player_banner expect.
 */
export function ImagesSection({ setValue, player }) {
  const playerName = [player.first_name, player.last_name].filter(Boolean).join(" ");

  return (
    <FormSection
      title="Images"
      description="Profile picture and banner image."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerImageUpload
          label="Profile Picture"
          initialUrl={player.photo?.url || ""}
          aspect={1}
          helpText="Crop tight to the face. 375×375px or larger."
          altText={playerName}
          onUploaded={({ id }) => setValue("profile_picture", id)}
        />

        <PlayerImageUpload
          label="Banner Image"
          initialUrl={player.banner?.url || ""}
          aspect={1200 / 350}
          helpText="1200×350px recommended."
          altText={`${playerName} banner`}
          onUploaded={({ id }) => setValue("player_banner", id)}
        />
      </div>
    </FormSection>
  );
}
