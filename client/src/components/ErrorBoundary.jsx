import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Something went wrong</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">
            An unexpected error occurred. Try refreshing the page or go back to the home screen.
          </p>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-slate-900 p-3 text-left text-xs text-red-300">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
