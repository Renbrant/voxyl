import { base44 } from '@/api/base44Client';

/**
 * Returns a wrapper that checks if the user is authenticated before running an action.
 * If not authenticated, redirects to login.
 */
export function useRequireAuth() {
  const requireAuth = (action) => {
    return async (...args) => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      return action(...args);
    };
  };

  const redirectToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return { requireAuth, redirectToLogin };
}