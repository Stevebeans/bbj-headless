"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminGuard, SaveBar } from "@/components/admin";
import { useFormState } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { updateSeason, addPlayerToSeason, removePlayerFromSeason, searchPlayers } from "@/lib/api/seasons";
import { BasicInfoSection } from "./BasicInfoSection";
import { DatesSection } from "./DatesSection";
import { ImagesSection } from "./ImagesSection";
import { WinnersSection } from "./WinnersSection";
import { PlayersSection } from "./PlayersSection";
import { RosterStatusSection } from "./RosterStatusSection";
import { SeasonSwitcher } from "./SeasonSwitcher";

const TABS = [
  { id: "spoiler", label: "Spoiler Bar", icon: "bars" },
  { id: "info", label: "Season Info", icon: "info" },
];

/**
 * Season edit form with all sections
 */
export function SeasonEditForm({ season, players: initialPlayers, slug, showHeader = true }) {
  const router = useRouter();
  const { user } = useAuth();
  const [players, setPlayers] = useState(initialPlayers || []);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("spoiler");

  // Form initial values
  const initialValues = {
    name: season.name || "",
    season_number: season.season_number || "",
    abbreviation: season.abbreviation || "",
    start_date: season.start_date || "",
    end_date: season.end_date || "",
    total_days: season.total_days || "",
    banner_image: season.banner_image || "",
    cover_image: season.cover_image || "",
    winner_id: season.winner_id || "",
    runner_up_id: season.runner_up_id || "",
    afp_id: season.afp_id || "",
    status: season.status || "upcoming",
  };

  // Validation
  const validate = useCallback((values) => {
    const errors = {};
    if (!values.name?.trim()) errors.name = "Season name is required";
    if (!values.season_number) errors.season_number = "Season number is required";
    return errors;
  }, []);

  // Submit handler
  const handleFormSubmit = useCallback(async (values) => {
    // Map frontend field names to API field names
    const apiData = {
      full_name: values.name,
      season_number: values.season_number,
      abbreviation: values.abbreviation,
      start_date: values.start_date,
      end_date: values.end_date,
      season_winner: values.winner_id || null,
      runner_up: values.runner_up_id || null,
      afp: values.afp_id || null,
    };

    const result = await updateSeason(season.id, apiData, user?.token);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    }
    return result;
  }, [season.id, user?.token, router]);

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

  // Player management handlers
  const handleAddPlayer = useCallback(async (player) => {
    const result = await addPlayerToSeason(season.id, player.id, user?.token);
    if (result.success) {
      setPlayers((prev) => [...prev, player]);
    }
    return result;
  }, [season.id, user?.token]);

  const handleRemovePlayer = useCallback(async (playerId) => {
    const result = await removePlayerFromSeason(season.id, playerId, user?.token);
    if (result.success) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
    return result;
  }, [season.id, user?.token]);

  return (
    <AdminGuard>
      <div className="pb-24">
        {/* Header - only shown when showHeader is true */}
        {showHeader && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Link href={`/bigbrother-seasons/${slug}`} className="hover:text-primary-500">
                {season.name}
              </Link>
              <span>/</span>
              <span>Edit</span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-display text-gray-900 dark:text-white">
                Edit {season.name}
              </h1>
              <Link
                href={`/bigbrother-seasons/${slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Season
              </Link>
            </div>
          </div>
        )}

        {/* Success message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 dark:text-green-200">Season saved successfully!</span>
          </div>
        )}

        {/* Season Switcher */}
        <div className="mb-4">
          <SeasonSwitcher currentSeasonId={season.id} currentSlug={slug} />
        </div>

        {/* Tab Navigation */}
        <div>
          <nav className="flex" role="tablist">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                  ${activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-primary-500 border border-b-0 border-slate-200 dark:border-gray-700 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-gray-700"
                  }
                  ${index === 0 && activeTab !== tab.id ? "border-l border-t border-slate-200 dark:border-gray-700" : ""}
                `}
              >
                <span className="flex items-center gap-2">
                  {tab.icon === "bars" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                  {tab.icon === "info" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Spoiler Bar Tab */}
          {activeTab === "spoiler" && (
            <RosterStatusSection
              seasonId={season.id}
              players={players}
              onPlayersUpdate={setPlayers}
              season={season}
            />
          )}

          {/* Season Info Tab */}
          {activeTab === "info" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInfoSection
                values={values}
                errors={errors}
                onChange={handleChange}
                onBlur={handleBlur}
                getFieldProps={getFieldProps}
              />

              <DatesSection
                values={values}
                errors={errors}
                onChange={handleChange}
                onBlur={handleBlur}
                getFieldProps={getFieldProps}
              />

              <ImagesSection
                values={values}
                errors={errors}
                setValue={setValue}
              />

              <WinnersSection
                values={values}
                errors={errors}
                setValue={setValue}
                players={players}
              />

              <PlayersSection
                seasonId={season.id}
                players={players}
                onAddPlayer={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
              />
            </form>
          )}
        </div>

        {/* Save bar - only show on info tab */}
        {activeTab === "info" && (
          <SaveBar
            isDirty={isDirty}
            isSubmitting={isSubmitting}
            onSave={handleSubmit}
            onCancel={() => reset()}
            error={submitError}
          />
        )}
      </div>
    </AdminGuard>
  );
}
