
import React, { Component, ErrorInfo, ReactNode } from 'react';

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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white p-6 text-center">
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg">
                        <span className="material-icons text-5xl text-red-500 mb-4">error_outline</span>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-stone-400 mb-6">
                            The application encountered an unexpected error. This is likely due to missing configuration.
                        </p>

                        <div className="bg-black/30 p-4 rounded-lg text-left overflow-auto mb-6 max-h-40">
                            <code className="text-xs text-red-300 font-mono">
                                {this.state.error?.message || 'Unknown error'}
                            </code>
                        </div>

                        <div className="text-sm text-stone-500">
                            <p className="font-bold mb-1">Troubleshooting:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Check browser console for details</li>
                                <li>Verify environment variables (VITE_SUPABASE_URL)</li>
                                <li>Ensure network connection is stable</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-8 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
