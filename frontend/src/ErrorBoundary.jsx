import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Optionally log error to an external service
        // logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h2>
                    <p className="mb-2">{this.state.error?.message || 'An unexpected error occurred.'}</p>
                    <details className="whitespace-pre-wrap text-xs text-gray-500 max-w-xl mx-auto" style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.location.reload()}>Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
