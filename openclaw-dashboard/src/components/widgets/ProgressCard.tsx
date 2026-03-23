import { WidgetWrapper } from './WidgetWrapper';

interface ProgressItem {
  label: string;
  progress: number;
  color?: string;
  statusText?: string;
}

interface ProgressCardConfig {
  items: ProgressItem[];
}

interface Props {
  title?: string;
  config: ProgressCardConfig;
}

export function ProgressCard({ title, config }: Props) {
  const { items } = config;

  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col gap-2 flex-1 justify-center">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-12 shrink-0 font-medium text-right overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: 'var(--color-text)' }}
            >
              {item.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-primary-lighter)' }}>
              <div
                className="h-full rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${Math.min(100, Math.max(0, item.progress))}%`,
                  background: item.color || 'var(--color-primary)',
                }}
              />
            </div>
            {item.statusText && (
              <span
                className="text-[0.65rem] font-semibold w-[30px] shrink-0 text-right"
                style={{ color: 'var(--color-primary)' }}
              >
                {item.statusText}
              </span>
            )}
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
