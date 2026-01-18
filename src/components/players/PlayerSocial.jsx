import { SocialLinks } from "@/components/shared";

/**
 * Player social media links section
 */
export function PlayerSocial({ player, className = "" }) {
  const { social, first_name } = player;

  if (!social) {
    return null;
  }

  const hasSocial = social.twitter || social.instagram || social.facebook || social.tiktok;

  if (!hasSocial) {
    return null;
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Follow {first_name || "on Social Media"}
        </h3>
        <SocialLinks
          twitter={social.twitter}
          instagram={social.instagram}
          facebook={social.facebook}
          tiktok={social.tiktok}
          size="md"
        />
      </div>
    </div>
  );
}
