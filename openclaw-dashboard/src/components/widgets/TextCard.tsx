import { WidgetWrapper } from './WidgetWrapper';

interface TextCardConfig {
  content: string;
  fontSize?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  color?: string;
}

interface Props {
  title?: string;
  config: TextCardConfig;
}

export function TextCard({ title, config }: Props) {
  const { content, fontSize, fontWeight, textAlign = 'left', verticalAlign = 'center', color } = config;
  const justifyMap = { top: 'justify-start', center: 'justify-center', bottom: 'justify-end' } as const;

  return (
    <WidgetWrapper title={title}>
      <div className={`flex-1 flex flex-col ${justifyMap[verticalAlign]}`} style={{ textAlign }}>
        <p
          className="m-0 leading-relaxed whitespace-pre-wrap"
          style={{
            fontSize: fontSize || '1rem',
            fontWeight: fontWeight || 500,
            color: color || 'var(--color-text)',
          }}
        >
          {content}
        </p>
      </div>
    </WidgetWrapper>
  );
}
