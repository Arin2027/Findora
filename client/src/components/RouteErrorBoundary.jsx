import { Component } from "react";
import { Link } from "react-router-dom";

export class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">This page failed to load</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You can return home or try again.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm"
            >
              Retry
            </button>
            <Link to="/" className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm">
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
