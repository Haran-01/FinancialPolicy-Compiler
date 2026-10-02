import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // In production, send to error tracking service (e.g., Sentry)
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 border border-error/30">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Something went wrong</h2>
            <p className="mt-1 text-sm text-text-muted max-w-sm">
              An unexpected error occurred. The error has been logged.
            </p>
          </div>
          {this.state.error && (
            <pre className="max-w-md overflow-auto rounded-md bg-surface border border-border p-3 text-xs text-error text-left">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="btn-secondary gap-2 flex items-center"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
