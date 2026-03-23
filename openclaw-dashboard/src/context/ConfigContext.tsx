import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DashboardConfig, WidgetConfig } from '../types';

interface ConfigContextType {
  config: DashboardConfig;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  updateConfig: (updates: Partial<DashboardConfig>) => void;
  exportConfig: () => string;
  importConfig: (json: string) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}

interface Props {
  initialConfig: DashboardConfig;
  children: React.ReactNode;
}

export function ConfigProvider({ initialConfig, children }: Props) {
  const [config, setConfig] = useState<DashboardConfig>(initialConfig);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, ...updates } : w),
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as DashboardConfig;
      setConfig(parsed);
    } catch (e) {
      console.error('Failed to import config:', e);
    }
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateWidget, updateConfig, exportConfig, importConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}
