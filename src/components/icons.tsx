import type { SVGProps } from 'react';

/**
 * Cohesive stroke-icon set (1.6 stroke, round caps), drawn in currentColor.
 * No emoji used for structural UI — these scale crisply and theme cleanly.
 */
type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Base({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const HeartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20.5C7 17 3.5 13.8 3.5 9.6 3.5 7 5.5 5 8 5c1.7 0 3.1.9 4 2.3C12.9 5.9 14.3 5 16 5c2.5 0 4.5 2 4.5 4.6 0 4.2-3.5 7.4-8.5 10.9Z" />
  </Base>
);

export const EnvelopeIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7.5 12 13l8.5-5.5" />
  </Base>
);

export const SparkleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3c.5 3.5 2 5 5.5 5.5C14 9 12.5 10.5 12 14c-.5-3.5-2-5-5.5-5.5C10 8 11.5 6.5 12 3Z" />
    <path d="M18.5 14c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" />
  </Base>
);

export const TimelineIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3v18" />
    <circle cx="12" cy="6.5" r="2" />
    <circle cx="12" cy="17.5" r="2" />
    <path d="M14 6.5h4M6 17.5h4" />
  </Base>
);

export const GalleryIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
  </Base>
);

export const LeafIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 19c0-8 5-13 14-14 1 9-4 14-12 14" />
    <path d="M5 19c2.5-4 5-6.5 9-8.5" />
  </Base>
);

export const StarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </Base>
);

export const LetterIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h9l5 5v13H6z" />
    <path d="M14 3v5h5" />
    <path d="M9 12h7M9 15.5h7" />
  </Base>
);

export const StatsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20h16" />
    <rect x="6" y="11" width="3" height="6" rx="1" />
    <rect x="11" y="7" width="3" height="10" rx="1" />
    <rect x="16" y="13" width="3" height="4" rx="1" />
  </Base>
);

export const WrappedIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const KeyIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="8" r="4" />
    <path d="m11 11 8 8M16 16l2-2M18.5 18.5 20 17" />
  </Base>
);

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </Base>
);

export const MenuIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m14 6-6 6 6 6" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m10 6 6 6-6 6" />
  </Base>
);

export const BookmarkIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 4h12v16l-6-4-6 4z" />
  </Base>
);

export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
  </Base>
);

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 5.5v13l11-6.5z" />
  </Base>
);

export const PauseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5v14M16 5v14" />
  </Base>
);

export const HourglassIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 4h10M7 20h10" />
    <path d="M7 4c0 4 5 5 5 8 0 3-5 4-5 8M17 4c0 4-5 5-5 8 0 3 5 4 5 8" />
  </Base>
);

export const HeartFilledIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 20.5C7 17 3.5 13.8 3.5 9.6 3.5 7 5.5 5 8 5c1.7 0 3.1.9 4 2.3C12.9 5.9 14.3 5 16 5c2.5 0 4.5 2 4.5 4.6 0 4.2-3.5 7.4-8.5 10.9Z" />
  </svg>
);

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Base>
);
