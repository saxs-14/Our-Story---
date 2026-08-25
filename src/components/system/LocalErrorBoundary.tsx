import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Rendered in place of the failed subtree — the rest of the page stays
   *  fully usable. Unlike the app-wide ErrorBoundary, this never navigates
   *  away or offers a reload; the failure is scoped to whatever this wraps. */
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Scoped error boundary for a single feature/component whose failure
 * shouldn't take the rest of the app down with it — e.g. a decorative 3D
 * scene that might fail to init WebGL on an old device or in a restricted
 * webview. The app-wide ErrorBoundary in App.tsx still exists as the
 * backstop for everything this doesn't cover.
 */
export class LocalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Our Story] Scoped render error:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
