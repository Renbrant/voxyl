import { base44 } from '@/api/base44Client';
import { redirectToLogin as doRedirectToLogin } from '@/lib/authRedirect';

/**
 * Returns a wrapper that checks if the user is authenticated before running an action.
 * If not authenticated, redirects to login (using external browser on Android WebView).
 */
export function useRequireAuth() {
  const requireAuth = (action) => {
    return async (...args) => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        doRedirectToLogin(window.location.href);
        return;
      }
      return action(...args);
    };
  };

  const redirectToLogin = () => {
    doRedirectToLogin(window.location.href);
  };

  return { requireAuth, redirectToLogin };
}