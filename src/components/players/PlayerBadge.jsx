import Image from "next/image";

/**
 * Small player badge for lists and forms
 * Shows player photo, name, and optional remove button
 */
export function PlayerBadge({ player, onRemove, removable = false, size = "default" }) {
  const sizeClasses = {
    small: "p-1.5 gap-1.5",
    default: "p-2 gap-2",
    large: "p-3 gap-3",
  };

  const imageSizes = {
    small: 24,
    default: 32,
    large: 40,
  };

  return (
    <div
      className={`
        flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg
        ${sizeClasses[size]}
      `}
    >
      {player.photo || player.image ? (
        <Image
          src={player.photo || player.image}
          alt={player.name}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className={`
            rounded-full object-cover flex-shrink-0
            w-[${imageSizes[size]}px] h-[${imageSizes[size]}px]
          `}
          unoptimized
        />
      ) : (
        <div
          className={`
            rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center
            text-slate-600 dark:text-slate-300 font-medium flex-shrink-0
            w-[${imageSizes[size]}px] h-[${imageSizes[size]}px]
          `}
          style={{ width: imageSizes[size], height: imageSizes[size] }}
        >
          {player.name?.charAt(0) || player.first_name?.charAt(0) || "?"}
        </div>
      )}

      <div className="flex-grow min-w-0">
        <div className={`font-medium truncate ${size === "small" ? "text-xs" : "text-sm"}`}>
          {player.name}
        </div>
        {player.nickname && size !== "small" && (
          <div className="text-xs text-gray-500 truncate">
            &quot;{player.nickname}&quot;
          </div>
        )}
      </div>

      {removable && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(player.id)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`Remove ${player.name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
