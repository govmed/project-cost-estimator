/**
 * OidcAuthProvider — wraps the app in react-oidc-context when AUTH_MODE=oidc.
 * In standalone mode this is a no-op passthrough.
 */

import { type ReactNode } from 'react';
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { AUTH_MODE, oidcConfig } from './oidc-config';

export function AuthProvider({ children }: { children: ReactNode }) {
  if (AUTH_MODE !== 'oidc') {
    return <>{children}</>;
  }
  return <OidcProvider {...oidcConfig}>{children}</OidcProvider>;
}
