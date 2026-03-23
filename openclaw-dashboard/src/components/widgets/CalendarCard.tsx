import { useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';

interface CalendarCardConfig {
  highlightDates?: string[];
  markerDates?: Record<string, string>;
}

interface Props {
  title?: string;
  config: CalendarCardConfig;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function CalendarCard({ title, config }: Props) {
  const { highlightDates = [], markerDates = {} } = config;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const formatDate = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <WidgetWrapper title={title}>
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <button onClick={prevMonth} className="bg-transparent border-none cursor-pointer text-xl px-2 leading-none" style={{ color: 'var(--color-text-secondary)' }}>‹</button>
        <span className="text-[0.8rem] font-semibold" style={{ color: 'var(--color-text)' }}>
          {currentYear} {MONTHS[currentMonth]}
        </span>
        <button onClick={nextMonth} className="bg-transparent border-none cursor-pointer text-xl px-2 leading-none" style={{ color: 'var(--color-text-secondary)' }}>›</button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 flex-1 content-start">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[0.6rem] text-center py-0.5 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = formatDate(day);
          const isHighlighted = highlightDates.includes(dateStr);
          const marker = markerDates[dateStr];
          const todayDate = isToday(day);

          return (
            <div
              key={day}
              className="flex flex-col items-center justify-center text-[0.7rem] px-0.5 py-0.5 rounded-md relative cursor-default leading-snug"
              style={{
                background: todayDate
                  ? 'var(--color-primary)'
                  : isHighlighted
                    ? 'var(--color-primary-lighter)'
                    : 'transparent',
                color: todayDate ? '#fff' : 'var(--color-text)',
                fontWeight: todayDate ? 700 : 400,
              }}
            >
              {day}
              {marker && (
                <div className="w-1 h-1 rounded-full absolute bottom-px" style={{ background: marker }} />
              )}
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
