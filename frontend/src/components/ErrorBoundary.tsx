import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI render failed', error, errorInfo);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return this.props.fallback ? (
        this.props.fallback(error)
      ) : (
        <div className="p-6 text-sm text-destructive">
          {error.message || 'Có lỗi khi hiển thị giao diện.'}
        </div>
      );
    }

    return this.props.children;
  }
}
