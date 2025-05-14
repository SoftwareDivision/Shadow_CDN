import React from "react";
import { Button } from "@/components/ui/button"; // Adjust path based on your setup
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Optional: Add Alert component

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    // Update state to trigger the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to the console
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
    // Store errorInfo in state for display
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Alert variant="destructive">
              <AlertTitle className="text-lg"> Something Went Wrong</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  {this.state.error && this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-left text-gray-900 dark:text-gray-100 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button
              variant="destructive"
              onClick={() => window.location.reload()}
              className="mt-6"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
