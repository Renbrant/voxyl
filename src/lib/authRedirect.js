import { base44 } from '@/api/base44Client';

/**
 * Redirects to login in a way that works on both web and Android WebView.
 * Google OAuth blocks WebView logins with a 403 error.
 * On Android WebViews, we use window.open('_blank') which most hosts
 * route to the system browser, bypassing the WebView restriction.
 */
export function redirectToLogin(nextUrl) {
  const next = nextUrl || window.location.href;

  // Detect Android WebView: UA contains "wv" or lacks Chrome standalone
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(ua) && (/wv\)/.test(ua) || /Version\/\d/.test(ua));

  if (isAndroidWebView) {
    // Get the login URL from the SDK internals or build it manually
    const appId = localStorage.getItem('base44_app_id') || import.meta.env.VITE_BASE44_APP_ID;
    const appBaseUrl = import.meta.env.VITE_BASE44_APP_BASE_URL || '';
    const loginUrl = `${appBaseUrl}/api/auth/login?app_id=${appId}&next=${encodeURIComponent(next)}`;
    window.open(loginUrl, '_blank');
  } else {
    base44.auth.redirectToLogin(next);
  }
}