"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { followUser, unfollowUser } from "@/lib/api/users";
import RankBadge from "@/components/comments/RankBadge";
import OnlineIndicator from "@/components/comments/OnlineIndicator";
import SupporterBadge from "./SupporterBadge";
import { FaUserPlus, FaUserCheck, FaSpinner, FaComments } from "react-icons/fa";

/**
 * UserProfileHero - Hero section for user profile page
 * Shows avatar, name, badges, stats, and follow button
 *
 * @param {Object} profile - User profile data from API
 */
export default function UserProfileHero({ profile }) {
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followerCount, setFollowerCount] = useState(profile.stats.followers);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = user?.id === profile.id;

  const handleFollowToggle = async () => {
    if (!isAuthenticated || isSelf || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const result = await unfollowUser(profile.id);
        if (result.success) {
          setIsFollowing(false);
          setFollowerCount(result.follower_count);
        }
      } else {
        const result = await followUser(profile.id);
        if (result.success) {
          setIsFollowing(true);
          setFollowerCount(result.follower_count);
        }
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 h-24 sm:h-32" />

      {/* Content */}
      <div className="px-4 sm:px-6 pb-6">
        {/* Avatar - positioned to overlap header */}
        <div className="relative flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
          <div className="relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-800 shadow-lg">
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Online indicator */}
            {profile.is_online && (
              <OnlineIndicator
                isOnline={true}
                size="lg"
                className="absolute bottom-2 right-2"
              />
            )}
          </div>

          {/* Message + Follow buttons */}
          {isAuthenticated && !isSelf && (
            <div className="flex items-center gap-2">
              <Link
                href={`/messages?to=${profile.id}&name=${encodeURIComponent(profile.username)}`}
                className="px-4 py-2 rounded-lg text-sm sm:text-base font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Message
              </Link>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  disabled:opacity-50 text-sm sm:text-base
                  ${
                    isFollowing
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                      : "bg-primary-500 hover:bg-primary-600 text-white"
                  }
                `}
              >
                {followLoading ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <FaUserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Following</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Follow</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Name and username */}
        <div className="mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            {profile.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {profile.rank && <RankBadge rank={profile.rank} size="md" />}
          {profile.supporter_type && (
            <SupporterBadge type={profile.supporter_type} size="md" />
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <FaComments className="w-4 h-4 text-slate-400" />
            <strong className="text-slate-800 dark:text-white">
              {profile.stats.comments}
            </strong>{" "}
            Comments
          </span>
          <span>
            <strong className="text-green-600 dark:text-green-400">
              {profile.stats.karma}
            </strong>{" "}
            Karma
          </span>
          <span>
            <strong className="text-slate-800 dark:text-white">
              {followerCount}
            </strong>{" "}
            Followers
          </span>
          <span>
            <strong className="text-slate-800 dark:text-white">
              {profile.stats.following}
            </strong>{" "}
            Following
          </span>
        </div>

        {/* Member since */}
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Member since {profile.member_since_formatted}
          {profile.is_online ? (
            <span className="ml-2 text-green-500">Online now</span>
          ) : profile.last_active ? (
            <span className="ml-2">Last seen {profile.last_active}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
