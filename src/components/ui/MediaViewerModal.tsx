import { motion } from 'framer-motion';
import { CloseIcon } from '@/components/icons';

/**
 * Full-screen tap-to-view for an image/video attachment — shared by Chat
 * and Timeline (and anywhere else that shows a media attachment inline at
 * thumbnail size) so this exact set of iOS/layout fixes lives in one place
 * instead of drifting across copies.
 */
export function MediaViewerModal({
  url,
  type,
  onClose,
}: {
  url: string;
  type: 'image' | 'video';
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="tap absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-warmwhite"
      >
        <CloseIcon width={22} height={22} />
      </button>
      {type === 'image' ? (
        <motion.img
          src={url}
          alt="Attachment"
          // min-h-0/min-w-0 override the flex-item default automatic
          // minimum size (= the image's intrinsic size for a replaced
          // element) — without them, a large phone-camera photo can't
          // shrink below its native resolution and overflows this flex
          // container, getting clipped by the fixed-viewport edges instead
          // of scaling down. max-h/w-full + object-contain only take effect
          // once this default minimum is cleared.
          className="max-h-full max-w-full min-h-0 min-w-0 rounded-lg object-contain"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <motion.video
          src={url}
          controls
          // No autoPlay: this video isn't muted, and iOS Safari's autoplay
          // policy silently blocks unmuted autoplay — the play() call
          // rejects with no visible error, leaving a black frame that looks
          // broken. `controls` lets the user start playback themselves.
          playsInline
          className="max-h-full max-w-full min-h-0 min-w-0 rounded-lg object-contain"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </motion.div>
  );
}
