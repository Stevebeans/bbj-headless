import Link from "next/link";

/**
 * Player meta information (hometown, occupation, age, etc.)
 * Plus breadcrumb navigation
 */
export function PlayerMeta({ player }) {
  const { city, state, hometown, occupation, age, gender, first_name } = player;

  const location = hometown || [city, state].filter(Boolean).join(", ");

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-500 dark:text-gray-400 mb-3" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-primary-500 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/players" className="hover:text-primary-500 hover:underline">
              Players
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-700 dark:text-gray-300 font-medium" aria-current="page">
            {first_name || "Player"}
          </li>
        </ol>
      </nav>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {location && (
          <MetaItem icon={<LocationIcon />} label="Hometown" value={location} />
        )}
        {occupation && (
          <MetaItem icon={<BriefcaseIcon />} label="Occupation" value={occupation} />
        )}
        {age && (
          <MetaItem icon={<CalendarIcon />} label="Age" value={`${age} years old`} />
        )}
        {gender && (
          <MetaItem icon={<UserIcon />} label="Gender" value={capitalize(gender)} />
        )}
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-gray-800 dark:text-gray-200 font-medium">{value}</div>
      </div>
    </div>
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Icons
function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
