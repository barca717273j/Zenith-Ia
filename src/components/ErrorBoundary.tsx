import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zenit-black flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card p-8 text-center space-y-6 border-zenit-accent/30">
            <div className="w-20 h-20 bg-zenit-accent/20 rounded-full flex items-center justify-center mx-auto border border-zenit-accent/30 shadow-lg shadow-zenit-accent/20">
              <AlertTriangle className="text-zenit-accent w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-zenit-text-primary uppercase tracking-tight">System Error</h2>
              <p className="text-zenit-text-secondary text-sm leading-relaxed">
                Ocorreu um erro crítico no sistema Zenit. A conexão neural pode ter sido interrompida.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left">
                <p className="text-[10px] font-mono text-zenit-accent/80 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest"
            >
              <RefreshCw size={16} />
              Reiniciar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
