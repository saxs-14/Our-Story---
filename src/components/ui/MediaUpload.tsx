import { useRef, useState, type ReactNode } from 'react';
import { saveMedia } from '@/lib/idb';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface Props {
  accept?: string;
  onUploaded: (mediaId: string) => void;
  children: ReactNode;
  className?: string;
  label: string;
}

/** A tap-to-pick control that stores the chosen file in IndexedDB and returns its id. */
export function MediaUpload({ accept = 'image/*', onUploaded, children, className, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Previously a saveMedia() failure (IndexedDB quota exceeded, private
  // browsing) had no catch at all — the button just silently did nothing,
  // indistinguishable from a broken tap. This surfaces it inline instead.
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    haptic('soft');
    try {
      const rec = await saveMedia(file);
      onUploaded(rec.id);
    } catch (err) {
      console.error('MediaUpload saveMedia failed', err);
      setError("Couldn't save that file — try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={label}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn('tap', busy && 'opacity-60', className)}
      >
        {children}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="sr-only" aria-hidden tabIndex={-1} />
      {error && (
        <p role="alert" className="mt-1 text-xs text-rosegold-500">
          {error}
        </p>
      )}
    </>
  );
}
