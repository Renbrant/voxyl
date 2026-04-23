import { base44 } from '@/api/base44Client';

/**
 * Redirects to login using the Base44 SDK flow.
 * This works for both web and Android WebView (via Custom Tabs or in-app browser).
 */
export function redirectToLogin() {
  // Do not pass any next URL — let the SDK handle the OAuth redirect URI natively
  base44.auth.redirectToLogin();
}