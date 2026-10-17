import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShoppingBag } from 'lucide-react';

interface Props {
  children: ReactNode;
  routeKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RouteErrorBoundary] Unhandled render error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Automatically clear error when user navigates to a new route
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-page-enter">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-black text-slate-900 leading-tight mb-1.5">
            Screen Temporarily Unavailable
          </h2>

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-6">
            We encountered an unexpected issue while rendering this page. Your order data and cart remain safe.
          </p>

          {Boolean((import.meta as any).env?.DEV) && this.state.error && (
            <div className="w-full max-w-xs p-3 bg-stone-100 rounded-xl text-left text-[11px] font-mono text-rose-800 border border-stone-200 mb-6 overflow-x-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
            <button
              onClick={this.handleRetry}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all btn-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Screen</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all btn-press"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Return to Explore</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
