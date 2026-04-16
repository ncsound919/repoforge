import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RepoForge] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: 16,
            color: "#f87171",
          }}
        >
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 style={{ color: "#f87171" }}>Something went wrong</h2>
          <p style={{ color: "#94a3b8", maxWidth: 480, textAlign: "center" }}>
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            style={{ background: "#1e293b", color: "#38bdf8", border: "1px solid #334155" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
