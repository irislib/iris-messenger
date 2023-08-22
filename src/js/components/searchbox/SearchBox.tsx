import { createRef } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import Show from '@/components/helpers/Show.tsx';
import SearchForm from '@/components/searchbox/SearchForm.tsx';
import SearchPostsRow from '@/components/searchbox/SearchPostsRow.tsx';
import SearchResult from '@/components/searchbox/SearchResult.tsx';

import localState from '../../state/LocalState';

import search from './search';

const SearchBox = (props) => {
  const inputRef = createRef();

  const [results, setResults] = useState([] as any[]);
  const [query, setQuery] = useState(props.query || '');
  const [selected, setSelected] = useState(-1);
  const [searchIndexUpdated, setSearchIndexUpdated] = useState(0);

  const close = () => {
    setResults([]);
    setQuery('');
  };

  const handleTabAndEsc = (e) => {
    if (e.key === 'Tab' && document.activeElement?.tagName === 'BODY') {
      e.preventDefault();
      inputRef.current.focus();
    } else if (e.key === 'Escape') {
      close();
      inputRef.current.blur();
    }
  };

  const onKeyUp = (e) => {
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();

      let next = selected;
      if (e.keyCode === 40) {
        next = next < results.length - 1 ? next + 1 : -1; // Similar changes here
      } else if (e.keyCode === 38) {
        next = next > -1 ? next - 1 : results.length - 1; // Similar changes here
      }

      setSelected(next);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setQuery('');
    inputRef.current.blur();

    // Get the active item based on the selected index
    const selectedItem = results[selected]?.item;
    if (selectedItem && props.onSelect) {
      props.onSelect(selectedItem);
    }

    close();
  };

  useEffect(() => {
    query && search({ inputRef, query, onSelect: props.onSelect, setResults });
  }, [searchIndexUpdated, query]);

  useEffect(() => {
    const subs = [] as any[];
    subs.push(localState.get('searchIndexUpdated').on(() => setSearchIndexUpdated((n) => n + 1)));
    subs.push(localState.get('activeRoute').on(() => close()));
    document.addEventListener('keydown', handleTabAndEsc);
    props.focus && inputRef.current?.focus();

    return () => {
      subs.forEach((unsub) => unsub());
      document.removeEventListener('keydown', handleTabAndEsc);
    };
  }, [props.query]);

  useEffect(() => {
    setQuery(props.query);
  }, [props.query]);

  return (
    <div className={`relative ${props.class}`}>
      <Show when={!props.resultsOnly}>
        <SearchForm
          onKeyUp={onKeyUp}
          onSubmit={onSubmit}
          inputRef={inputRef}
          setQuery={setQuery}
          query={query}
        />
      </Show>
      <div
        className={`${
          query ? '' : 'hidden'
        } absolute z-20 left-0 mt-2 w-full bg-black border border-neutral-700 rounded shadow-lg`}
      >
        <Show when={query && !props.resultsOnly}>
          <SearchPostsRow
            selected={selected === -1}
            onResultFocus={(_, index) => setSelected(index)}
            query={query}
          />
        </Show>
        {results.map((r, index) => (
          <SearchResult
            key={r.item.key}
            item={r.item}
            selected={index === selected}
            onFocus={() => setSelected(index)}
            onClick={(e) => {
              if (props.onSelect) {
                e.preventDefault();
                e.stopPropagation();
                props.onSelect(r.item);
              }
              close();
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchBox;
