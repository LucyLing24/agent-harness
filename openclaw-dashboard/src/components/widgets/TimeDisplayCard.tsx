import { WidgetWrapper } from './WidgetWrapper';

interface TimeDisplayCardConfig {
  time: string;
  label?: string;
  subtitle?: string;
  timeColor?: string;
}

interface Props {
  title?: string;
  config: TimeDisplayCardConfig;
}

export function TimeDisplayCard({ title, config }: Props) {
  const { time, label, subtitle, timeColor } = config;

  return (
    <WidgetWrapper title={title || label}>
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        <div
          className="text-4xl font-black leading-none"
          style={{ color: timeColor || 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
        >
          {time}
        </div>
        {subtitle && (
          <div className="text-[0.65rem] text-center mt-1 italic" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
