import React from 'react';

interface Props {
  children: React.ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors so a single page crash does not blank the whole app. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full bg-cream flex flex-col items-center justify-center px-8 text-center">
          <h2 className="font-display font-bold text-lg text-ink mb-2">Something went wrong</h2>
          <p className="text-sm text-muted mb-6">
            {this.props.label ? `${this.props.label} could not load.` : 'This screen could not load.'}{' '}
            Pull to refresh or go back and try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-6 py-3 rounded-xl bg-green text-white font-bold text-sm active:scale-95 transition-transform"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
