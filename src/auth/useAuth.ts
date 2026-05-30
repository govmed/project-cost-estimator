/**
 * useAuth — uniform auth state regardless of mode.
 *
 * In standalone mode: always authenticated (no backend auth).
 * In oidc mode: delegates to react-oidc-context.
 */

import { useAuth as useOidcAuth } from 'react-oidc-context';
import { AUTH_MODE } from './oidc-config';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  // Always call the hook (Rules of Hooks) — it's a no-op in standalone mode
  // because AuthProvider won't mount OidcProvider in that case.
  // We use a try/catch to handle the case where the hook is called outside a provider.
  let oidc: ReturnType<typeof useOidcAuth> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    oidc = useOidcAuth();
  } catch {
    // Not inside OidcProvider — standalone mode
  }

  if (AUTH_MODE !== 'oidc' || !oidc) {
    return {
      isAuthenticated: true,
      isLoading: false,
      accessToken: null,
      userEmail: null,
      userName: null,
      login: () => {},
      logout: () => {},
    };
  }

  return {
    isAuthenticated: oidc.isAuthenticated,
    isLoading: oidc.isLoading,
    accessToken: oidc.user?.access_token ?? null,
    userEmail: oidc.user?.profile.email ?? null,
    userName: oidc.user?.profile.name ?? oidc.user?.profile.preferred_username ?? null,
    login: () => void oidc!.signinRedirect(),
    logout: () => void oidc!.signoutRedirect(),
  };
}
