import type { ComponentType, SVGProps } from 'react';
import {
  HomeIcon,
  EnvelopeIcon,
  SparkleIcon,
  TimelineIcon,
  GalleryIcon,
  LeafIcon,
  StarIcon,
  LetterIcon,
  StatsIcon,
  WrappedIcon,
  KeyIcon,
} from '@/components/icons';

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Shown in the 5-slot bottom dock (others live in the "More" menu). */
  primary?: boolean;
  /** Hidden from the More grid until unlocked. */
  secret?: boolean;
  blurb: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: HomeIcon, primary: true, blurb: 'Our living counter & today’s note' },
  { path: '/vault', label: 'Vault', icon: EnvelopeIcon, primary: true, blurb: 'Open-when letters for every mood' },
  { path: '/reasons', label: 'Reasons', icon: SparkleIcon, blurb: '500 reasons I love you' },
  { path: '/timeline', label: 'Timeline', icon: TimelineIcon, primary: true, blurb: 'From friends to forever' },
  { path: '/gallery', label: 'Gallery', icon: GalleryIcon, blurb: 'Our moments, framed' },
  { path: '/garden', label: 'Garden', icon: LeafIcon, primary: true, blurb: 'A living garden of us' },
  { path: '/dreams', label: 'Dreams', icon: StarIcon, blurb: 'The future we’re building' },
  { path: '/letters', label: 'Letters', icon: LetterIcon, blurb: 'A library of love letters' },
  { path: '/statistics', label: 'Statistics', icon: StatsIcon, blurb: 'Our story in numbers' },
  { path: '/wrapped', label: 'Wrapped', icon: WrappedIcon, blurb: 'Our year, replayed' },
  { path: '/secret', label: 'Secret', icon: KeyIcon, secret: true, blurb: 'Hidden, just for you' },
];

export const PRIMARY_NAV = NAV_ITEMS.filter((n) => n.primary);
export const MORE_NAV = NAV_ITEMS.filter((n) => !n.primary);

export function navByPath(path: string): NavItem | undefined {
  return NAV_ITEMS.find((n) => n.path === path);
}
