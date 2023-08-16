import { Event, Filter } from 'nostr-tools';

import { EventComponentProps } from '@/components/events/EventComponent';

export type FeedProps = {
  filterOptions: FilterOption[];
  showDisplayAs?: boolean;
  filterFn?: (event: any) => boolean;
  emptyMessage?: string;
  fetchEvents?: (opts: any) => {
    events: Event[];
    loadMore: () => void;
  };
};

export type DisplayAs = 'feed' | 'grid';

export type ImageOrVideo = {
  type: 'image' | 'video';
  url: string;
  eventId: string;
};

export type FilterOption = {
  name: string;
  filter: Filter;
  filterFn?: (event: Event) => boolean;
  eventProps?: Partial<EventComponentProps>;
};
