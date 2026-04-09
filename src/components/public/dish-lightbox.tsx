import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';

interface DishLightboxProps {
  open: boolean;
  onClose: () => void;
  slides: { src: string }[];
  index?: number;
}

export const DishLightbox = ({ open, onClose, slides, index = 0 }: DishLightboxProps) => {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Zoom, Fullscreen]}
      styles={{
        container: { backgroundColor: 'rgba(0,0,0,0.95)' },
        button: { color: 'var(--theme-primary, #1A1A1A)' },
      }}
      zoom={{ maxZoomPixelRatio: 3 }}
    />
  );
};
