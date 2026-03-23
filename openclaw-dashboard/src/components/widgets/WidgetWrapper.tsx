import type { ReactNode, CSSProperties } from 'react';

interface Props {
  title?: string;
  titleColor?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  noPadding?: boolean;
}

export function WidgetWrapper({ title, titleColor, children, className = '', style, noPadding }: Props) {
  return (
    <div
      className={`widget flex flex-col overflow-hidden h-full box-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${noPadding ? '' : 'p-4'} ${className}`}
      style={{
        background: 'var(--color-card-bg)',
        borderRadius: 'var(--bento-radius)',
        ...style,
      }}
    >
      {title && (
        <div
          className={`text-[0.72rem] font-bold tracking-wide mb-2 shrink-0 text-center ${noPadding ? 'px-4 pt-4' : ''}`}
          style={{ color: titleColor || 'var(--color-primary)' }}
        >
          {title}
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}
