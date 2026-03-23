import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useConfig } from '../context/ConfigContext';
import { Sun, Moon, Settings } from 'lucide-react';

interface Props {
  onSettingsClick: () => void;
  onEditClick?: () => void;
}

export function Header({ onSettingsClick, onEditClick }: Props) {
  const { isDark, toggleTheme } = useTheme();
  const { config } = useConfig();
  const { header } = config;
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const d = now.getDate();
      const h = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
      const w = weekNames[now.getDay()];
      setDateStr(`${y}年${m}月${d}日 ${h}:${min} 周${w}`);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="flex items-center justify-between h-12 px-3 shrink-0 relative z-10"
      style={{
        background: 'var(--color-header-bg)',
        margin: '0',
      }}
    >
      {/* Left side */}
      <div className="flex items-center  h-full relative">
        {/* <img
            src={header.avatar ? header.avatar : `https://i.pravatar.cc/150?u=${encodeURIComponent(header.title || 'user')}`}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover shrink-0"
        /> */}

        {/* Rounded tab indicator */}
        <div className="relative self-stretch flex items-end -ml-6">
          <div className="w-[clamp(160px,18vw,300px)] h-10 relative flex items-center justify-center z-[6] ml-9 ">
            <div className="text-md font-bold whitespace-nowrap z-10 m-0" style={{ color: 'var(--color-text)' }}>
              {header.title}
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 307 52" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M37.6151 26C41.0415 12.6789 49.994 0 63.7487 0H244.01C257.762 0 266.701 12.6863 270.145 26C275.407 46.3439 307 52 307 52H0C0 52 32.2952 46.6826 37.6151 26Z" fill="var(--color-bg)" />
            </svg>
          </div>
          <div className="w-[clamp(160px,18vw,300px)] h-10 relative flex items-center justify-center z-[5] -ml-[4vw]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 307 52" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M37.6151 26C41.0415 12.6789 49.994 0 63.7487 0H244.01C257.762 0 266.701 12.6863 270.145 26C275.407 46.3439 307 52 307 52H0C0 52 32.2952 46.6826 37.6151 26Z" fill="var(--color-primary-light)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {header.showDate !== false && (
          <span className="text-xs whitespace-nowrap font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            {dateStr}
          </span>
        )}

        <div className='flex '>
        {header.showThemeToggle !== false && (
          <button
            onClick={toggleTheme}
            className="bg-transparent border-none cursor-pointer p-1.5 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-120"
            style={{ color: 'var(--color-text-secondary)' }}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        )}

        {header.showSettings !== false && (
          <button
            onClick={onSettingsClick}
            className="bg-transparent border-none cursor-pointer p-1.5 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-120"
            style={{ color: 'var(--color-text-secondary)' }}
            title="设置"
          >
            <Settings size={16} />
          </button>
        )}

        </div>

        {header.showEditButton !== false && (
          <button
            onClick={onEditClick}
            className="border-none rounded-xl px-5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'var(--color-primary-light)'}}
          >
            {header.editButtonText || '编辑组件'}
          </button>
        )}
      </div>
    </header>
  );
}
