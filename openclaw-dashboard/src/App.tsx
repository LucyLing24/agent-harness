import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { Header } from './components/Header';
import { BentoGrid } from './components/BentoGrid';
import { SettingsModal } from './components/SettingsModal';
import dashboardConfig from './config/dashboard.json';
import type { DashboardConfig, ThemeConfig } from './types';

function DashboardApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
          style={{ background: 'var(--color-header-bg)' }}
    >
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        onEditClick={() => setSettingsOpen(true)}
      />
    <div
      className={`w-full mx-auto flex flex-col box-border overflow-hidden rounded-t-3xl rounded-b-none ${isMobile ? 'min-h-screen' : 'h-[calc(100vh-48px)]'}`}
      style={{ padding: 'var(--bento-padding)', background: 'var(--color-bg)' }}
    >
      <BentoGrid isMobile={isMobile} />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
    </div>
  );
}

export default function App() {
  const config = dashboardConfig as unknown as DashboardConfig;
  const lightTheme = config.theme;
  const darkTheme = (config.darkTheme || config.theme) as ThemeConfig;

  return (
    <ConfigProvider initialConfig={config}>
      <ThemeProvider lightTheme={lightTheme} darkTheme={darkTheme} font={config.font} bento={config.bento}>
        <DashboardApp />
      </ThemeProvider>
    </ConfigProvider>
  );
}
