import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { exportEmergencyStateBackup, repairAndResetSessionState } from './lib/sessionRecovery.ts';
import './index.css';

// Guard against cross-origin iframe security errors, extension scripts, and ResizeObserver loop limits
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = String(event.message || '');
    if (
      msg.includes('cross-origin') ||
      msg.includes('SecurityError') ||
      msg.includes('Blocked a frame') ||
      msg.includes('ResizeObserver') ||
      msg.includes('Script error') ||
      msg.includes('chrome-extension')
    ) {
      event.preventDefault();
      console.warn('Absorbed transient browser/extension window error:', msg);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason?.message || event.reason || '');
    if (
      reason.includes('cross-origin') ||
      reason.includes('SecurityError') ||
      reason.includes('Blocked a frame') ||
      reason.includes('ResizeObserver') ||
      reason.includes('AbortError') ||
      reason.includes('Load failed') ||
      reason.includes('Failed to fetch') ||
      reason.includes('chrome-extension')
    ) {
      event.preventDefault();
      console.warn('Absorbed transient promise rejection:', reason);
    }
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[RootErrorBoundary] Caught React component tree exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleSoftRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleRepairSessionState = () => {
    repairAndResetSessionState();
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleExportBackup = () => {
    exportEmergencyStateBackup();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center selection:bg-amber-500/30">
          <div className="max-w-lg w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 text-xl font-bold">
              ⚡
            </div>
            
            <h1 className="text-xl font-bold text-white mb-1.5">Bolex Workspace Recovery</h1>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
              A transient render condition occurred in session state. Choose a recovery mode below to continue seamlessly.
            </p>

            {/* Granular Recovery Actions */}
            <div className="flex flex-col gap-2.5 mb-6">
              <button
                type="button"
                onClick={this.handleSoftRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-all shadow-md hover:shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🔄</span> Try Re-rendering Workspace
              </button>

              <button
                type="button"
                onClick={this.handleRepairSessionState}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🛠️</span> Repair Corrupted Session & Reload
              </button>

              <button
                type="button"
                onClick={this.handleExportBackup}
                className="w-full py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 font-medium text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span> Download Emergency Data Backup (.json)
              </button>
            </div>

            {/* Collapsible Diagnostic Info */}
            <div className="text-left border-t border-neutral-800 pt-4">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center justify-between w-full font-mono cursor-pointer"
              >
                <span>Diagnostic Logs</span>
                <span>{this.state.showDetails ? '▲ Hide' : '▼ View'}</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 overflow-x-auto max-h-48 text-left space-y-2">
                  <div>
                    <span className="text-amber-400 font-semibold">Error:</span>{' '}
                    {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <span className="text-amber-400 font-semibold">Component Trace:</span>
                      <pre className="text-neutral-400 whitespace-pre-wrap mt-1 leading-tight text-[9px]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
