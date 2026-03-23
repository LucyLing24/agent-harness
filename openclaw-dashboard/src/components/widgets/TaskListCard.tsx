import { WidgetWrapper } from './WidgetWrapper';

interface Task {
  icon?: string;
  text: string;
  time?: string;
  status?: 'pending' | 'done' | 'in-progress';
}

interface TaskListCardConfig {
  tasks: Task[];
  showProgress?: boolean;
}

interface Props {
  title?: string;
  config: TaskListCardConfig;
}

export function TaskListCard({ title, config }: Props) {
  const { tasks, showProgress = true } = config;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col gap-1.5 flex-1">
        {showProgress && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[0.65rem] font-bold mb-1 shrink-0"
            style={{
              background: 'var(--color-primary-lighter)',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {doneCount}/{tasks.length}
          </div>
        )}
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {task.icon && <span className="text-sm">{task.icon}</span>}
              <span
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{
                  color: task.status === 'done' ? 'var(--color-text-secondary)' : 'var(--color-text)',
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                }}
              >
                {task.text}
              </span>
            </div>
            {task.time && (
              <span
                className="font-semibold text-[0.7rem] shrink-0"
                style={{
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {task.time}
              </span>
            )}
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
