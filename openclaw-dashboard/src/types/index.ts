/* ===== Theme Colors ===== */
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  accent: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  border: string;
  headerBackground: string;
}

/* ===== Font Config ===== */
export interface FontConfig {
  family: string;
  monoFamily: string;
  titleSize: string;
  bodySize: string;
}

/* ===== Bento Config ===== */
export interface BentoConfig {
  gap: number;
  padding: number;
  borderRadius: number;
}

/* ===== Theme Config ===== */
export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

/* ===== Grid Position ===== */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ===== Widget Config ===== */
export interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  desktop: GridPosition;
  mobile: GridPosition;
  config: Record<string, any>;
}

/* ===== Header Config ===== */
export interface HeaderConfig {
  title: string;
  avatar?: string;
  showDate?: boolean;
  showThemeToggle?: boolean;
  showSettings?: boolean;
  showEditButton?: boolean;
  editButtonText?: string;
}

/* ===== Discord Config ===== */
export interface DiscordConfig {
  webhookUrl?: string;
}

/* ===== Dashboard Config (top-level JSON) ===== */
export interface DashboardConfig {
  theme: ThemeConfig;
  darkTheme?: ThemeConfig;
  font: FontConfig;
  bento: BentoConfig;
  header: HeaderConfig;
  discord?: DiscordConfig;
  grid: {
    desktop: { columns: number; rows: number };
    mobile: { columns: number; rows: number };
  };
  widgets: WidgetConfig[];
}
