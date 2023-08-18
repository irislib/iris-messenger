import { Filter as NostrToolsFilter } from 'nostr-tools';

type Filter = NostrToolsFilter & {
  keywords?: string[];
};
export default Filter;
