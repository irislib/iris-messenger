import Fuse from 'fuse.js';
import _ from 'lodash';

import localState from './LocalState';

const options = {
  keys: ['name', 'display_name'],
  includeScore: true,
  includeMatches: true,
  threshold: 0.3,
};

const notifyUpdate = _.throttle(() => {
  localState.get('searchIndexUpdated').put(true);
}, 2000);

const FuzzySearch = {
  index: new Fuse([], options),
  keys: new Set<string>(),
  add(doc: any) {
    if (this.keys.has(doc.key)) {
      return;
    }
    this.keys.add(doc.key);
    this.index.add(doc);
    notifyUpdate();
  },
  remove(key: string) {
    this.keys.delete(key);
    this.index.remove((doc) => doc.key === key);
    notifyUpdate();
  },
  search(query: string) {
    return this.index.search(query);
  },
};

export default FuzzySearch;
