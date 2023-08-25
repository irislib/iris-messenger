import React from 'react';
import { useMemo } from 'preact/hooks';

import FeedComponent from '@/components/feed/Feed';

import View from '../View';

type Props = {
  path: string;
  query?: string;
};

const Search: React.FC<Props> = ({ query }) => {
  const filterOptions = useMemo(() => {
    const filter = { kinds: [1], search: query };

    const filterFn = (event) => {
      // some relays don't support filtering by keyword
      return event.content.includes(query);
    };

    return [
      {
        name: 'Search',
        filter,
        filterFn,
      },
    ];
  }, [query]);

  return (
    <View>
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <FeedComponent key={query} filterOptions={filterOptions} />
        </div>
      </div>
    </View>
  );
};

export default Search;
