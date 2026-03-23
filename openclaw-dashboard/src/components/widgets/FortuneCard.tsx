import { WidgetWrapper } from './WidgetWrapper';

interface FortuneCardConfig {
  cardNumber: number;
  cardName: string;
  fortune: string;
}

interface Props {
  title?: string;
  config: FortuneCardConfig;
}

export function FortuneCard({ title, config }: Props) {
  const { cardNumber, cardName, fortune } = config;
  const imageSrc = new URL(`../../assets/tarot/${cardNumber}.png`, import.meta.url).href;

  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col items-center flex-1 min-h-0 gap-3">
        {/* Tarot image */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <img
            src={imageSrc}
            alt={cardName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Card name */}
        <div className="text-base font-bold shrink-0" style={{ color: 'var(--color-text)' }}>
          「{cardName}」
        </div>

        {/* Daily fortune */}
        <div className="text-sm text-center shrink-0 pb-1" style={{ color: 'var(--color-text)' }}>
          {fortune}
        </div>
      </div>
    </WidgetWrapper>
  );
}
