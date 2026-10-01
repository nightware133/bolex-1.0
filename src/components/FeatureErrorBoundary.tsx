import React, { Component, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(`[FeatureErrorBoundary:${this.props.featureName}] Caught exception:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="m-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">
                {this.props.featureName} experienced a transient view error
              </p>
              <p className="text-neutral-400 text-[11px] mt-0.5 max-w-lg line-clamp-1">
                {this.state.error?.message || 'Component state could not be rendered.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-[11px] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reset {this.props.featureName}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
