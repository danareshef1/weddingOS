'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lightbox } from './lightbox';

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="mb-4 cursor-pointer overflow-hidden rounded-lg break-inside-avoid"
            onClick={() => setSelectedIndex(index)}
          >
            <div className="group relative aspect-auto">
              <Image
                src={image.url}
                alt={image.caption || ''}
                width={600}
                height={400}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-sm text-white">{image.caption}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  );
}
