import type { ComponentType } from 'react';
import { NumberCard } from './NumberCard';
import { ImageCard } from './ImageCard';
import { TextCard } from './TextCard';
import { CalendarCard } from './CalendarCard';
import { TaskListCard } from './TaskListCard';
import { TaskTimelineCard } from './TaskTimelineCard';
import { ProgressCard } from './ProgressCard';
import { HeatmapCard } from './HeatmapCard';
import { FortuneCard } from './FortuneCard';
import { TimeDisplayCard } from './TimeDisplayCard';
import { BroadcastCard } from './BroadcastCard';
import { ResultListCard } from './ResultListCard';

export const widgetRegistry: Record<string, ComponentType<{ title?: string; config: any }>> = {
  NumberCard,
  ImageCard,
  TextCard,
  CalendarCard,
  TaskListCard,
  TaskTimelineCard,
  ProgressCard,
  HeatmapCard,
  FortuneCard,
  TimeDisplayCard,
  BroadcastCard,
  ResultListCard,
};

export {
  NumberCard,
  ImageCard,
  TextCard,
  CalendarCard,
  TaskListCard,
  TaskTimelineCard,
  ProgressCard,
  HeatmapCard,
  FortuneCard,
  TimeDisplayCard,
  BroadcastCard,
  ResultListCard,
};
