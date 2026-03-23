import { WidgetWrapper } from './WidgetWrapper';

interface BroadcastCardConfig {
  content: string;
  speaker?: string;
}

interface Props {
  title?: string;
  config: BroadcastCardConfig;
}

export function BroadcastCard({ title, config }: Props) {
  const { content, speaker } = config;

  return (
    <WidgetWrapper
      title={title}
      style={{ background: 'var(--color-primary-lighter)' }}
      titleColor="var(--color-primary)"
    >
      <div className="flex-1 flex flex-col justify-center gap-2">
        <p className="text-[0.78rem] m-0 leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {content}
        </p>
        {speaker && (
          <div className="text-[0.65rem] text-right" style={{ color: 'var(--color-text-secondary)' }}>
            — {speaker}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
