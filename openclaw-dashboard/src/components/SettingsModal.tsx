import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useConfig } from '../context/ConfigContext';
import { X, Download, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const { theme, font, bento, isDark, toggleTheme, updateTheme, updateFont, updateBento } = useTheme();
  const { exportConfig, importConfig } = useConfig();
  const [activeTab, setActiveTab] = useState<'theme' | 'layout' | 'config'>('theme');
  const [importText, setImportText] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importText.trim()) {
      importConfig(importText.trim());
      setImportText('');
      onClose();
    }
  };

  const handleColorChange = (key: string, value: string) => {
    updateTheme({
      colors: { ...theme.colors, [key]: value },
    });
  };

  const handleBentoChange = (key: string, value: number) => {
    updateBento({ [key]: value });
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onTouchMove={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        onTouchMove={e => e.preventDefault()}
      />

      {/* Modal */}
      <div
        className="relative rounded-2xl p-7 w-[90%] max-w-[520px] max-h-[80vh] overflow-y-auto overscroll-none shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        style={{ background: 'var(--color-card-bg)', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            设置
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-4 rounded-[12px] p-[3px] relative" style={{ background: 'var(--color-primary-lighter)' }}>
          {/* Sliding indicator */}
          <div
            className="absolute top-[3px] bottom-[3px] rounded-[10px] transition-all duration-300 ease-in-out"
            style={{
              background: 'var(--color-accent)',
              width: 'calc((100% - 6px) / 3)',
              left: `calc(3px + ${(['theme', 'layout', 'config'].indexOf(activeTab))} * (100% - 6px) / 3)`,
            }}
          />
          {(['theme', 'layout', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 p-2 border-none rounded-[10px] text-[0.8rem] font-semibold cursor-pointer transition-colors duration-300 relative z-[1]"
              style={{
                background: 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--color-text)',
              }}
            >
              {tab === 'theme' ? '主题' : tab === 'layout' ? '布局' : '配置'}
            </button>
          ))}
        </div>

        {/* ===== Theme Tab ===== */}
        {activeTab === 'theme' && (
          <div className="flex flex-col gap-4">
            {/* Dark mode toggle */}
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>暗色模式</span>
              <button
                onClick={toggleTheme}
                className="w-11 h-6 rounded-full border-none cursor-pointer relative transition-colors duration-200"
                style={{ background: isDark ? 'var(--color-primary-light)' : 'var(--color-header-bg)' }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  style={{ left: isDark ? '23px' : '4px' }}
                />
              </button>
            </div>

            {/* Color pickers */}
            <div className="text-[0.72rem] font-semibold mt-1 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              颜色
            </div>
            {([
              ['primary', '主色'],
              ['primaryLight', '主色（浅）'],
              ['accent', '辅色'],
              ['primaryLighter', '辅色（浅）'],
              ['background', '背景色'],
              ['cardBackground', '卡片背景'],
              ['text', '文字色'],
              ['textSecondary', '次要文字'],
              ['headerBackground', 'Header 背景'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[0.8rem]" style={{ color: 'var(--color-text)' }}>{label}</span>
                <div className="flex items-center gap-2 h-5">
                  <div className="text-[0.65rem]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {theme.colors[key]}
                  </div>
                  <input
                    type="color"
                    value={theme.colors[key].startsWith('#') ? theme.colors[key] : '#000000'}
                    onChange={e => handleColorChange(key, e.target.value)}
                    style={{border: '1px solid var(--color-header-bg)',}}
                    className="w-8 h-4 rounded-md cursor-pointer p-0 border-none appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Layout Tab ===== */}
        {activeTab === 'layout' && (
          <div className="flex flex-col gap-4">
            <div className="text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Bento 布局
            </div>
            {([
              ['gap', '间距 (px)', 0, 36],
              ['padding', '内边距 (px)',0, 36],
              ['borderRadius', '圆角 (px)', 0, 36],
            ] as const).map(([key, label, min, max]) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-[0.8rem]" style={{ color: 'var(--color-text)' }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-primary-light)', fontFamily: 'var(--font-mono)' }}>
                    {bento[key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={bento[key]}
                  onChange={e => handleBentoChange(key, Number(e.target.value))}
                  className="w-full range-primary appearance-none h-1 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary-light) 0%, var(--color-primary-light) ${((bento[key] - min) / (max - min)) * 100}%, var(--color-primary-lighter) ${((bento[key] - min) / (max - min)) * 100}%, var(--color-primary-lighter) 100%)`,
                  }}
                />
              </div>
            ))}

            <div className="text-[0.72rem] font-semibold mt-2 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              字体
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.8rem]" style={{ color: 'var(--color-text)' }}>字体系列</span>
              <select
                value={font.family}
                onChange={e => updateFont({ family: e.target.value })}
                className="px-3 py-2 rounded-lg text-[0.8rem] cursor-pointer"
                style={{
                  border: '1px solid var(--color-header-bg)',
                  background: 'var(--color-card-bg)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="'Noto Sans SC', sans-serif">Noto Sans SC</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="system-ui, sans-serif">System UI</option>
                <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
              </select>
            </div>
          </div>
        )}

        {/* ===== Config Tab ===== */}
        {activeTab === 'config' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={handleExport}
              className="p-2.5 rounded-[10px] border-none text-sm font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-85 flex items-center justify-center gap-1.5"
              style={{ background: 'var(--color-primary)',color:'var(--color-bg)' }}
            >
              <Download size={14} />导出 JSON 配置
            </button>

            <div className="text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              导入配置
            </div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="粘贴 JSON 配置到这里..."
              className="w-full h-[200px] p-3 rounded-[10px] text-xs resize-y box-border"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="p-2.5 rounded-[10px] border-none text-sm font-semibold transition-opacity duration-200 flex items-center justify-center gap-1.5"
              style={{
                background: importText.trim() ? 'var(--color-primary-light)' : 'var(--color-header-bg)',
                cursor: importText.trim() ? 'pointer' : 'not-allowed',
                color: 'var(--color-bg)',
              }}
            >
              <Upload size={14} />导入配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
