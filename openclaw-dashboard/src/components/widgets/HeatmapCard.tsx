import { WidgetWrapper } from './WidgetWrapper';

interface HeatmapCardConfig {
  data: Record<string, number>;
  weeks?: number;
  colors?: string[];
}

interface Props {
  title?: string;
  config: HeatmapCardConfig;
}

function getWeekDates(weeksBack: number): string[][] {
  const weeks: string[][] = [];
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

  for (let w = weeksBack - 1; w >= 0; w--) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + dayOfWeek - d));
      const iso = date.toISOString().split('T')[0];
      week.push(iso);
    }
    weeks.push(week);
  }
  return weeks;
}

export function HeatmapCard({ title, config }: Props) {
  const { data, weeks = 16, colors } = config;

  const defaultColors = [
    'var(--color-primary-lighter)',
    'rgba(255, 20, 147, 0.15)',
    'rgba(255, 20, 147, 0.3)',
    'rgba(255, 20, 147, 0.55)',
    'rgba(255, 20, 147, 0.85)',
  ];
  const palette = colors || defaultColors;
  const weekDates = getWeekDates(weeks);

  return (
    <WidgetWrapper title={title}>
      <div className="flex gap-0.5 flex-1 items-center justify-center overflow-hidden py-1">
        {weekDates.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((date) => {
              const intensity = data[date] ?? 0;
              return (
                <div
                  key={date}
                  title={`${date}: ${intensity}`}
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: palette[Math.min(intensity, palette.length - 1)] }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
