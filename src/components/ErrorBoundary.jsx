import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught unhandled error:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121612] text-[#1E2922] dark:text-[#E2EBE2] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#1A211B] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-2 text-[#1E2922] dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              A temporary issue interrupted the application. Clearing your local cache or reloading usually fixes this immediately.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#4B5D3C] hover:bg-[#3D4D30] text-white transition-all shadow-md active:scale-[0.98]"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Clear Cache & Restart
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left border-t border-gray-100 dark:border-white/5 pt-4">
                <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer select-none">
                  Technical Details
                </summary>
                <pre className="mt-2 text-[11px] p-2 bg-gray-50 dark:bg-black/40 rounded border border-gray-200 dark:border-white/5 text-red-500 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
