import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import SmallFeed from '../components/feed/SmallFeed';
import SearchBox from '../components/SearchBox';
import Events from '../nostr/Events';

const Search = (_props: any) => {
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    const storageKey = 'trendingNotes';
    const cachedData = localStorage.getItem(storageKey);

    const fetchData = () => {
      fetch('https://api.nostr.band/v0/trending/notes')
        .then((res) => res.json())
        .then((data) => {
          if (!data?.notes) return;
          const newTrendingPosts = data.notes.map((e) => e.event);
          newTrendingPosts.forEach((e) => {
            Events.handle(e);
          });

          setTrendingPosts(newTrendingPosts);

          // Store fetched data in localStorage with current timestamp
          localStorage.setItem(
            storageKey,
            JSON.stringify({ data: newTrendingPosts, timestamp: new Date().getTime() }),
          );
        })
        .catch(() => {
          // Network request failed. Try to use cached data
          if (cachedData) {
            const { data } = JSON.parse(cachedData);
            setTrendingPosts(data);
          }
        });
    };

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const age = (new Date().getTime() - timestamp) / 1000 / 60; // convert timestamp difference from milliseconds to minutes

      if (age < 15) {
        // Use cached data if it's less than 15 minutes old
        setTrendingPosts(data);
      } else {
        // Fetch new data if cached data is older than 15 minutes
        fetchData();
      }
    } else {
      // Fetch new data if no cached data
      fetchData();
    }
  }, []); // Empty dependency array ensures this effect runs only once (on component mount)

  return (
    <div class="mt-2 p-2 mx-2 md:mx-0 flex flex-col gap-4">
      <SearchBox
        focus={true}
        onSelect={({ key }) => {
          route('/' + key);
        }}
      />
      <SmallFeed events={trendingPosts} />
    </div>
  );
};

export default Search;
