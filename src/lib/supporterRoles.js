// Baseline roles that always get supporter benefits. The admin-configured list
// from /admin/ads (bbjd_freestar_settings.supporter_roles) is merged IN ADDITION
// to these, so adding a role there (e.g. second_in_command) grants supporter UI
// everywhere without a code change. full_bean isn't in the admin list but
// includes all Supporter perks, which is why the baseline still exists.
export const SUPPORTER_ROLES_BASE = [
  "administrator",
  "editor",
  "supporter",
  "lifetime",
  "full_bean",
];

export function isSupporterUser(user, configuredRoles = []) {
  if (!user || !Array.isArray(user.user_roles)) return false;
  return user.user_roles.some(
    (role) =>
      SUPPORTER_ROLES_BASE.includes(role) || configuredRoles.includes(role)
  );
}
