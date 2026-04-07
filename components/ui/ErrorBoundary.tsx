'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches runtime errors in child components
 * and displays a fallback UI instead of crashing the page.
 *
 * Usage:
 *   <ErrorBoundary name="AR Scanner">
 *     <ThreeJSCanvas />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in dev; send to observability in prod
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorBoundary:${this.props.name || 'unnamed'}]`, error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="text-white font-semibold mb-1">
              Something went wrong{this.props.name ? ` in ${this.props.name}` : ''}
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
