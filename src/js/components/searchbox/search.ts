import debounce from 'lodash/debounce';
import { route } from 'preact-router';

import Events from '@/nostr/Events.ts';
import FuzzySearch from '@/nostr/FuzzySearch.ts';
import Key from '@/nostr/Key.ts';

const RESULTS_MAX = 5;

const searchFromServer = debounce((query) => {
  fetch(`https://eu.rbr.bio/search/${query}.json`).then((res) => {
    res.json().then((json) => {
      if (json && Array.isArray(json)) {
        json.forEach((item) => {
          Events.handle(item[1]);
        });
      }
    });
  });
}, 500);

export default function search({ inputRef, onSelect, setResults, query }) {
  query = query.toString().trim().toLowerCase();
  if (!query) {
    return;
  }

  if (onSelect) {
    if (query.match(/.+@.+\..+/)) {
      Key.getPubKeyByNip05Address(query).then((pubKey) => {
        // if query hasn't changed since we started the request
        if (pubKey && query === String(inputRef.current.value)) {
          onSelect?.({ key: pubKey.hex });
        }
      });
    }

    if (query.startsWith('https://iris.to/')) {
      const path = query.replace('https://iris.to', '');
      route(path);
      return;
    }
    const noteMatch = query.match(/note[a-zA-Z0-9]{59,60}/gi);
    if (noteMatch) {
      route('/' + noteMatch[0]);
      return;
    }
    const npubMatch = query.match(/npub[a-zA-Z0-9]{59,60}/gi);
    if (npubMatch) {
      route('/' + npubMatch[0]);
      return;
    }
    const s = query.split('/profile/');
    if (s.length > 1) {
      return onSelect({ key: s[1] });
    }
    if (Key.toNostrHexAddress(query)) {
      return onSelect({ key: query });
    }
  }

  searchFromServer(query);

  if (query) {
    const results = FuzzySearch.search(query).slice(0, RESULTS_MAX);
    setResults(results);
  } else {
    setResults([]);
  }
}
