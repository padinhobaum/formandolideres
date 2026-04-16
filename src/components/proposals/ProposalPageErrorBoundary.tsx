import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, TriangleAlert } from "lucide-react";

interface ProposalPageErrorBoundaryProps {
  children: React.ReactNode;
}

interface ProposalPageErrorBoundaryState {
  hasError: boolean;
  retryKey: number;
}

export default class ProposalPageErrorBoundary extends React.Component<
  ProposalPageErrorBoundaryProps,
  ProposalPageErrorBoundaryState
> {
  state: ProposalPageErrorBoundaryState = {
    hasError: false,
    retryKey: 0,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Erro ao renderizar a página de propostas:", error);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      retryKey: prevState.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">Ocorreu um erro ao carregar esta página</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tente novamente para recarregar o edital com segurança.</p>
            <Button onClick={this.handleRetry} variant="outline" className="mt-5 gap-2 rounded-xl">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}