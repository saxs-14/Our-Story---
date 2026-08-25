import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared keyboard-accessibility behavior for every modal/dialog in the app:
 * Escape closes it, focus moves into it on open and is trapped there
 * (Tab/Shift+Tab cycle within the dialog instead of escaping to the page
 * behind it), and focus returns to whatever triggered it on close. None of
 * this existed before — every role="dialog" in the app was a mouse/touch-only
 * dead end for keyboard users, with no aria-modal and no way to know a
 * dialog even opened besides seeing it.
 */
export function useDialogA11y<T extends HTMLElement = HTMLDivElement>(onClose: () => void, active = true) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Callers commonly pass an inline arrow function, a new identity every
  // render — a ref keeps the effect below from re-binding every render
  // while still always invoking the LATEST onClose rather than freezing
  // whatever was passed on first render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // `active` covers two shapes of dialog: a component that's only ever
    // mounted while open (active defaults to true, this branch never
    // matters) and a dialog rendered conditionally inline inside an
    // always-mounted parent (active = the open flag) — this effect then
    // re-runs exactly when that flag flips true, by which point React has
    // already committed the dialog's DOM into containerRef.
    if (!active) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? container)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
    // onClose intentionally excluded from deps — read fresh via onCloseRef
    // instead so this only re-runs on an actual open/close transition, not
    // every render a new inline onClose identity happens to be passed.
  }, [active]);

  return containerRef;
}
