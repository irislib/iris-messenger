import { Filter } from 'nostr-tools';

import { EventComponentProps } from '@/components/events/EventComponent';

export type FeedProps = {
  filterOptions: FilterOption[];
  showDisplayAs?: boolean;
  filterFn?: (event: any) => boolean;
  emptyMessage?: string;
};

export type DisplayAs = 'feed' | 'grid';

export type ImageOrVideo = {
  type: 'image' | 'video';
  url: string;
};

export type FilterOption = {
  name: string;
  filter: Filter;
  filterFn?: (event: any) => boolean;
  eventProps?: Partial<EventComponentProps>;
};
