import type { AuthProviderProps } from 'react-oidc-context';

const authority = import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:9000/application/o/cost-estimator-api/';
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID ?? 'cost-estimator-spa';
const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI
  ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:5173/auth/callback');

export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'openid email profile',
  post_logout_redirect_uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  // PKCE is on by default in oidc-client-ts
  automaticSilentRenew: true,
  onSigninCallback() {
    // Remove OIDC params from the URL after login completes
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE ?? 'standalone') as 'standalone' | 'oidc';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
