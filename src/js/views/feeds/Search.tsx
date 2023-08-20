import React from 'react';
import { useMemo } from 'preact/hooks';

import FeedComponent from '@/components/feed/Feed';

import View from '../View';

type Props = {
  path: string;
  keyword?: string;
};

const Search: React.FC<Props> = ({ keyword }) => {
  const filterOptions = useMemo(() => {
    const filter = { kinds: [1], keywords: [keyword || ''] };

    const filterFn = (event) => {
      // some relays don't support filtering by keyword
      return event.content.includes(keyword);
    };

    return [
      {
        name: 'Search',
        filter,
        filterFn,
      },
    ];
  }, [keyword]);

  return (
    <View>
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <FeedComponent key={keyword} filterOptions={filterOptions} />
        </div>
      </div>
    </View>
  );
};

export default Search;
