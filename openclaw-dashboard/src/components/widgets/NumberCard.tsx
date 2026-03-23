import { WidgetWrapper } from './WidgetWrapper';

interface NumberCardConfig {
  number: number | string;
  label?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  numberColor?: string;
  numberSize?: string;
  suffix?: string;
}

interface Props {
  title?: string;
  config: NumberCardConfig;
}

export function NumberCard({ title, config }: Props) {
  const { number, label, trend, numberColor, numberSize, suffix } = config;

  return (
    <WidgetWrapper title={title}>
      <div className="flex-1 flex flex-col justify-center items-center">
        {label && (
          <div className="text-[0.7rem] font-bold mb-1 tracking-wide" style={{ color: 'var(--color-primary)' }}>
            {label}
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-black leading-none"
            style={{
              fontSize: numberSize || '2.5rem',
              color: numberColor || 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {number}
          </span>
          {suffix && <span className="text-base" style={{ color: 'var(--color-text-secondary)' }}>{suffix}</span>}
          {trend && (
            <span className={`text-sm font-semibold flex items-center gap-0.5 ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
}
