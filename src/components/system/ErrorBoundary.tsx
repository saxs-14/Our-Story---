import { Component, type ReactNode } from 'react';
import { HeartFilledIcon } from '@/components/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Without this, any uncaught render error anywhere in the tree (a bug, a
 * null a page didn't expect) takes down the whole app to a blank white
 * screen with no way back short of knowing to manually reload. This catches
 * that and offers a way out instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Our Story] Unhandled render error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: 'radial-gradient(circle at 50% 30%, #2a172a, #160b16 60%, #0d060d)' }}
      >
        <span className="text-rosegold-400">
          <HeartFilledIcon width={40} height={40} />
        </span>
        <p className="font-display text-xl text-warmwhite">Something went sideways ♥</p>
        <p className="max-w-xs text-sm text-warmwhite/70">
          Our Story hit a snag. Your memories are safe — try reloading.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-gradient-to-br from-rosegold-400 to-rosegold-600 px-6 py-3 text-sm font-medium text-warmwhite shadow-glow"
        >
          Reload
        </button>
      </div>
    );
  }
}
