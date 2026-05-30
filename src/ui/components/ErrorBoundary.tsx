import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[SOW Calc] Unhandled error in',
      this.props.screenName ?? 'screen',
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="mx-auto max-w-2xl px-8 py-12"
        >
          <h2 className="text-lg font-semibold text-status-bad">Something went wrong</h2>
          {this.props.screenName && (
            <p className="mt-1 text-sm text-muted-fg">
              The <strong>{this.props.screenName}</strong> screen encountered an unexpected error.
            </p>
          )}
          <pre className="mt-4 overflow-auto rounded border border-border bg-muted/20 p-4 text-xs text-foreground">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
