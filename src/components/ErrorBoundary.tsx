import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logSystemEvent } from '../services/logService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    logSystemEvent('error', error.message, { errorInfo, stack: error.stack });
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Zenith encountered a security restriction during ${parsed.operationType} at ${parsed.path}. Please check your permissions.`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zenith-black flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 max-w-sm space-y-4 border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-display font-bold">System Error</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl transition-colors font-medium"
            >
              Restart Zenith
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
