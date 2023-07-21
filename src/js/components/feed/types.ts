export interface FeedProps {
  index?: string;
  scrollElement?: HTMLElement;
  filter?: any;
  keyword?: any;
  emptyMessage?: string;
  nostrUser?: string;
}

export interface FeedState {
  events: string[];
  queuedEvents: string[];
  displayCount: number;
  eventsShownTime: number;
  settings: {
    display: string;
    realtime: boolean;
    showReplies: boolean;
    sortBy: string;
    sortDirection: string;
    timespan: string;
  };
  settingsOpen?: boolean;
  showNewMsgsFixedTop?: boolean;
}
