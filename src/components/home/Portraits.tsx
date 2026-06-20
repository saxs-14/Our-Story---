import { motion } from 'framer-motion';
import { useContentStore } from '@/store/useContentStore';
import { personById, type PersonId } from '@/store/useAuthStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { MediaUpload } from '@/components/ui/MediaUpload';
import relationship from '@/config/relationship';
import { formatLongDate } from '@/lib/time';

function PortraitCard({ id }: { id: PersonId }) {
  const photoId = useContentStore((s) => s.profiles[id].photoMediaId);
  const setPhoto = useContentStore((s) => s.setProfilePhoto);
  const url = useMediaUrl(photoId);
  const person = personById(id);

  return (
    <div className="flex flex-col items-center">
      <MediaUpload
        accept="image/*"
        label={`Add or change ${person.nickname}'s photo`}
        onUploaded={(mediaId) => setPhoto(id, mediaId)}
        className="group relative block"
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-glass ring-2 ring-warmwhite/70">
          {url ? (
            <img src={url} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-warmwhite"
              style={{ background: id === 'her' ? 'linear-gradient(135deg,#f6c9a8,#e3706a)' : 'linear-gradient(135deg,#c9c2e8,#b76e79)' }}
            >
              {person.initial}
            </div>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-plum-900/45 py-0.5 text-center text-[0.55rem] uppercase tracking-luxe text-warmwhite opacity-0 transition-opacity group-hover:opacity-100">
            {url ? 'change' : 'add photo'}
          </span>
        </div>
      </MediaUpload>
      <p className="mt-2 font-display text-lg font-semibold text-[color:var(--ink-strong)]">{person.nickname}</p>
      <p className="text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">
        {formatLongDate(person.birthday).replace(/ \d{4}$/, '')}
      </p>
      {id === 'her' && (
        <p className="mt-0.5 text-[0.55rem] text-champagne-600">✝️ God-fearing</p>
      )}
      {id === 'him' && (
        <p className="mt-0.5 text-[0.55rem] text-rosegold-500">💻 Builder of this</p>
      )}
    </div>
  );
}

/** The two of you, side by side, with the heart between. */
export function Portraits() {
  return (
    <motion.div
      className="mb-5 flex items-center justify-center gap-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <PortraitCard id="him" />
      <div className="flex flex-col items-center pb-6">
        <motion.span className="text-2xl text-rosegold-500" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          ❤️
        </motion.span>
        <span className="mt-1 text-[0.55rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">
          since {formatLongDate(relationship.relationshipStart).replace(/ \d{4}$/, '')}
        </span>
      </div>
      <PortraitCard id="her" />
    </motion.div>
  );
}
