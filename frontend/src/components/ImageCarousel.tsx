import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

interface Props {
  images: string[];
  alt?: string;
  height?: number | string;
  style?: React.CSSProperties;
}

export const ImageCarousel: React.FC<Props> = ({ images, alt, height = '100%', style }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); };
  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx((i) => (i + 1) % images.length); };

  return (
    <Box sx={{ position: 'relative', width: '100%', height }} style={style}>
      <img
        src={images[idx]}
        alt={alt || `image-${idx}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {images.length > 1 && (
        <>
          <IconButton
            aria-label="previous image"
            onClick={prev}
            sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' } }}
            size="small"
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>

          <IconButton
            aria-label="next image"
            onClick={next}
            sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' } }}
            size="small"
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>

          <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {images.map((_, i) => (
              <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === idx ? 'white' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ImageCarousel;
