import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-display text-7xl text-rosegold-400">♡</p>
        <h1 className="mt-4 font-display text-3xl text-[color:var(--ink-strong)]">This page wandered off</h1>
        <p className="mt-2 max-w-xs text-[color:var(--ink-soft)]">
          Even our story has a few blank pages. Let's get you back to the good parts.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="primary">Back home</Button>
        </Link>
      </div>
    </PageShell>
  );
}
