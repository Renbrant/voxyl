import { base44 } from '@/api/base44Client';

/**
 * Redirects to login using the Base44 SDK flow.
 * This works for both web and Android WebView (via Custom Tabs or in-app browser).
 */
export function redirectToLogin(nextUrl) {
  // Pass only the relative path as next — full URLs with domains can cause 403 on Google OAuth
  let next = '/';
  if (nextUrl) {
    try {
      const url = new URL(nextUrl, window.location.origin);
      next = url.pathname + url.search + url.hash;
    } catch {
      next = '/';
    }
  } else {
    next = window.location.pathname + window.location.search + window.location.hash;
  }
  base44.auth.redirectToLogin(next);
}