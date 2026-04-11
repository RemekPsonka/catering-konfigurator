import { useState } from 'react';
import { motion } from 'framer-motion';
import { MasonryPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/masonry.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import { fadeIn } from '@/lib/animations';

export interface GalleryPhoto {
  photo_url: string;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  alt_text?: string | null;
  is_hero?: boolean;
}

interface EventGallerySectionProps {
  photos: GalleryPhoto[];
}

export const EventGallerySection = ({ photos }: EventGallerySectionProps) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const galleryPhotos = photos.filter((p) => !p.is_hero);
  if (galleryPhotos.length === 0) return null;

  const albumPhotos = galleryPhotos.map((p) => ({
    src: p.photo_url,
    width: p.width ?? 800,
    height: p.height ?? 600,
    alt: p.alt_text || p.caption || 'Realizacja Catering Śląski',
  }));

  const lightboxSlides = galleryPhotos.map((p) => ({
    src: p.photo_url,
    alt: p.alt_text || p.caption || 'Realizacja Catering Śląski',
    title: p.caption || undefined,
    description: p.alt_text || undefined,
  }));

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Galeria realizacji
        </h2>
        <MasonryPhotoAlbum
          photos={albumPhotos}
          columns={(containerWidth) => {
            if (containerWidth < 640) return 2;
            if (containerWidth < 1024) return 3;
            return 4;
          }}
          spacing={8}
          onClick={({ index }) => setLightboxIndex(index)}
          render={{
            image: (props) => (
              <img {...props} loading="lazy" className="cursor-pointer rounded-lg" />
            ),
          }}
        />
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
        plugins={[Captions]}
      />
    </motion.section>
  );
};
