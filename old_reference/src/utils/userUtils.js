export const isAdmin = user => {
  return user.user_roles && user.user_roles.includes("administrator");
};

export const isPremium = user => {
  // Replace this logic with your actual condition to check if a user is premium
  // For demonstration purposes, we assume a user with role "premium" is a premium user
  return user.user_roles && user.user_roles.includes("premium");
};
