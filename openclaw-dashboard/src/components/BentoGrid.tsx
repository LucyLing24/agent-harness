import { useConfig } from '../context/ConfigContext';
import { widgetRegistry } from './widgets';
import type { WidgetConfig } from '../types';

interface Props {
  isMobile: boolean;
}

export function BentoGrid({ isMobile }: Props) {
  const { config } = useConfig();
  const { grid, widgets } = config;

  const { columns, rows } = isMobile ? grid.mobile : grid.desktop;

  return (
    <div
      className="h-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: isMobile
          ? `repeat(${rows}, minmax(140px, auto))`
          : `repeat(${rows}, 1fr)`,
        gap: 'var(--bento-gap)',
        overflow: isMobile ? 'auto' : undefined,
      }}
    >
      {widgets.map((widget: WidgetConfig) => {
        const Component = widgetRegistry[widget.type];
        if (!Component) {
          console.warn(`Unknown widget type: ${widget.type}`);
          return null;
        }

        const pos = isMobile ? widget.mobile : widget.desktop;

        return (
          <div
            key={widget.id}
            className="min-w-0 min-h-0"
            style={{
              gridColumn: `${pos.x + 1} / span ${pos.w}`,
              gridRow: `${pos.y + 1} / span ${pos.h}`,
            }}
          >
            <Component title={widget.title} config={widget.config} />
          </div>
        );
      })}
    </div>
  );
}
