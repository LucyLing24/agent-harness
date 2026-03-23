import { WidgetWrapper } from './WidgetWrapper';

interface ResultItem {
  color: string;
  text: string;
  timeAgo: string;
}

interface ResultListCardConfig {
  items: ResultItem[];
}

interface Props {
  title?: string;
  config: ResultListCardConfig;
}

export function ResultListCard({ title, config }: Props) {
  const { items } = config;

  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col gap-3 flex-1 justify-center">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                {item.text}
              </span>
            </div>
            <span className="text-[0.7rem] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
              {item.timeAgo}
            </span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
