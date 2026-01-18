// src/utils/navigation.js

import { useRouter } from "next/router";

export const redirectToLogin = router => {
  const currentPath = router.asPath;
  router.push(`/bbjlogin?referrer=${encodeURIComponent(currentPath)}`);
};
