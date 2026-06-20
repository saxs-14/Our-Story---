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

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    haptic('soft');
    try {
      const rec = await saveMedia(file);
      onUploaded(rec.id);
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
    </>
  );
}
