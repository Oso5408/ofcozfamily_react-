import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const isEnvError = this.state.error?.message?.includes('environment variable') ||
                        this.state.error?.message?.includes('Supabase not configured');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isEnvError ? 'Configuration Error' : 'Something Went Wrong'}
              </h1>

              <p className="text-gray-600 mb-6">
                {isEnvError
                  ? 'The application is not properly configured. Please contact the administrator.'
                  : 'We encountered an unexpected error. Please try refreshing the page.'}
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="w-full bg-gray-100 rounded p-4 mb-6 text-left overflow-auto max-h-48">
                  <p className="text-xs font-mono text-red-600 break-all">
                    {this.state.error?.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {isEnvError && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
                  <p className="text-sm text-yellow-800">
                    <strong>For administrators:</strong> Please ensure the following environment variables are set:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 space-y-1 font-mono">
                    <li>• VITE_SUPABASE_URL</li>
                    <li>• VITE_SUPABASE_ANON_KEY</li>
                  </ul>
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
