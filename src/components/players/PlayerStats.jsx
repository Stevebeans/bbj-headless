import { StatCard, StatCardGrid } from "@/components/shared";

/**
 * Career statistics grid for player profile.
 * `advanced` = { hoh, pov, hohPlayed, vetoPlayed } career totals — win-rate
 * cards render only for seasons with comp-participation tracking (played > 0).
 * `extras` = { misc, saved, survived } points-input career totals.
 */
export function PlayerStats({ stats, advanced, points = null, extras = null, className = "" }) {
  const {
    total_hoh = 0,
    total_pov = 0,
    total_nom = 0,
    total_votes = 0,
    total_days = 0,
    total_seasons = 0,
  } = stats || {};

  const pct = (wins, played) => `${Math.round(((Number(wins) || 0) / played) * 100)}%`;
  const showHohRate = advanced?.hohPlayed > 0;
  const showVetoRate = advanced?.vetoPlayed > 0;

  return (
    <StatCardGrid columns={6} className={className}>
      {points !== null && (
        <StatCard
          label="Points"
          value={points}
          icon={<TrophyIcon />}
          tooltip="Career points: HoH 2.5, Veto 2, other comps 1, surviving a vote 1.5, saved off the block 1, nomination -1"
        />
      )}
      <StatCard
        label="Seasons"
        value={total_seasons}
        icon={<CalendarIcon />}
        tooltip="Number of seasons played"
      />
      <StatCard
        label="HoH Wins"
        value={total_hoh}
        icon={<CrownIcon />}
        tooltip="Head of Household wins"
      />
      <StatCard
        label="PoV Wins"
        value={total_pov}
        icon={<MedalIcon />}
        tooltip="Power of Veto wins"
      />
      <StatCard
        label="Nominated"
        value={total_nom}
        icon={<TargetIcon />}
        tooltip="Times nominated for eviction"
      />
      <StatCard
        label="Votes"
        value={total_votes}
        icon={<VoteIcon />}
        tooltip="Eviction votes received"
      />
      <StatCard
        label="Days"
        value={total_days}
        icon={<ClockIcon />}
        tooltip="Total days in the Big Brother house"
      />
      {extras !== null && (
        <>
          <StatCard
            label="Other Comps"
            value={extras.misc}
            icon={<BoltIcon />}
            tooltip="Block Buster, AI Arena, and other recorded comp wins"
          />
          <StatCard
            label="Survived Block"
            value={extras.survived}
            icon={<ShieldIcon />}
            tooltip="Eviction nights survived while on the block"
          />
          <StatCard
            label="Veto Saved"
            value={extras.saved}
            icon={<LifeRingIcon />}
            tooltip="Times the veto pulled them off the block"
          />
        </>
      )}
      {showHohRate && (
        <StatCard
          label="HoH Win Rate"
          value={pct(advanced.hoh, advanced.hohPlayed)}
          icon={<CrownIcon />}
          tooltip={`Won ${advanced.hoh} of ${advanced.hohPlayed} HoH comps played`}
        />
      )}
      {showVetoRate && (
        <StatCard
          label="Veto Win Rate"
          value={pct(advanced.pov, advanced.vetoPlayed)}
          icon={<MedalIcon />}
          tooltip={`Won ${advanced.pov} of ${advanced.vetoPlayed} veto comps played`}
        />
      )}
    </StatCardGrid>
  );
}

// Icons
function TrophyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4m-5-9a5 5 0 0010 0V4H7v8zM7 6H4a1 1 0 00-1 1v1a4 4 0 004 4m10-6h3a1 1 0 011 1v1a4 4 0 01-4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LifeRingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <circle cx="12" cy="12" r="4" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M5.6 5.6l3.5 3.5m5.8 0l3.5-3.5m0 12.8l-3.5-3.5m-5.8 0l-3.5 3.5" />
    </svg>
  );
}
