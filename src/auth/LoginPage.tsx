import { useAuth } from './useAuth';

export function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">SOW Cost Calculator</h1>
        <p className="mt-2 text-sm text-muted-fg">Sign in to access your projects.</p>
      </div>
      <button
        type="button"
        onClick={login}
        disabled={isLoading}
        className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {isLoading ? 'Loading…' : 'Sign in with SSO'}
      </button>
      <p className="text-xs text-muted-fg">
        Powered by{' '}
        <a
          href="https://goauthentik.io"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Authentik
        </a>
      </p>
    </div>
  );
}
