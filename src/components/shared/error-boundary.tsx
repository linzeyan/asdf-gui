import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <Card className="border-border/50 bg-card max-w-md rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <AlertCircle className="text-destructive size-10" />
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground text-sm">
                {this.state.error?.message ?? "An unexpected error occurred."}
              </p>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
