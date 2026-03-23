import { WidgetWrapper } from './WidgetWrapper';

interface TimelineItem {
  time: string;
  text: string;
  status?: 'done' | 'current' | 'pending';
  color?: string;
}

interface TaskTimelineCardConfig {
  items: TimelineItem[];
}

interface Props {
  title?: string;
  config: TaskTimelineCardConfig;
}

export function TaskTimelineCard({ title, config }: Props) {
  const { items } = config;

  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col gap-0.5 flex-1 overflow-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs py-0.5">
            {/* Time label */}
            <span
              className="text-[0.7rem] w-9 shrink-0 text-right"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
            >
              {item.time}
            </span>

            {/* Timeline line + dot */}
            <div className="flex flex-col items-center w-2 shrink-0 relative self-stretch">
              {i !== items.length - 1 && (
                <div className="absolute top-0 bottom-0 w-[1.5px]" style={{ background: 'var(--color-border)' }} />
              )}
              <div
                className="w-1.5 h-1.5 rounded-full relative z-[1] mt-[7px] shrink-0"
                style={{
                  background:
                    item.status === 'done' ? 'var(--color-primary)' :
                    item.status === 'current' ? 'var(--color-accent)' :
                    'var(--color-border)',
                }}
              />
            </div>

            {/* Text */}
            <span
              className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: item.status === 'pending' ? 'var(--color-text-secondary)' : 'var(--color-text)' }}
            >
              {item.text}
            </span>

            {/* Status square */}
            <div
              className="w-2 h-2 rounded-sm shrink-0"
              style={{
                background: item.color || 'var(--color-primary)',
                opacity: item.status === 'pending' ? 0.3 : 1,
              }}
            />
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
