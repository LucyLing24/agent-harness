import { WidgetWrapper } from './WidgetWrapper';

interface ImageCardConfig {
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: string;
}

interface Props {
  title?: string;
  config: ImageCardConfig;
}

export function ImageCard({ title, config }: Props) {
  const { src, alt = '', objectFit = 'cover', borderRadius } = config;

  return (
    <WidgetWrapper title={title} noPadding={!title}>
      <div
        className="flex-1 overflow-hidden"
        style={{ borderRadius: title ? '8px' : 'var(--bento-radius)' }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full block"
          style={{
            objectFit,
            borderRadius: borderRadius || 'inherit',
          }}
        />
      </div>
    </WidgetWrapper>
  );
}
