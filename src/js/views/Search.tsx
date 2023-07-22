import { memo } from 'react';
import { nip19 } from 'nostr-tools';
import { Link, route } from 'preact-router';

import Avatar from '../components/Avatar';
import FollowButton from '../components/buttons/Follow';
import SmallFeed from '../components/feed/SmallFeed';
import Name from '../components/Name';
import SearchBox from '../components/SearchBox';
import useCachedFetch from '../hooks/useCachedFetch';
import Events from '../nostr/Events';
import Key from '../nostr/Key';

const FollowSuggestionsAPI = memo(() => {
  const url = `https://api.nostr.band/v0/suggested/profiles/${Key.getPubKey()}`;
  const suggestions = useCachedFetch(url, 'followSuggestions', (data) => data.profiles || []);

  if (!suggestions.length) return null;

  return (
    <div className="card-body p-4">
      <h2 className="card-title">Follow suggestions</h2>
      <hr className="opacity-10" />
      <div className="-ml-2 flex flex-wrap gap-4 items-center text-xs overflow-y-scroll overflow-x-hidden max-h-screen">
        {suggestions.map((profile: any) => (
          <Link
            href={`/${nip19.npubEncode(profile.pubkey)}`}
            key={profile.pubkey}
            className="flex flex-row gap-2 w-full break-words"
          >
            <span className="flex-shrink-0">
              <Avatar str={profile.pubkey} width={30} />
            </span>
            <span className="flex-1">
              <b>
                <Name pub={profile.pubkey} />
              </b>
              <br />
              <span className="text-neutral-400">{profile.bio}</span>
            </span>
            <span className="flex-shrink-0">
              <FollowButton className="btn btn-sm" id={profile.pubkey} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
});

const Search = (props: any) => {
  const url = 'https://api.nostr.band/v0/trending/notes';
  const dataProcessor = (data) => {
    const newTrendingPosts = data.notes.map((e) => e.event);
    newTrendingPosts.forEach((e) => {
      Events.handle(e);
    });
    return newTrendingPosts;
  };
  const trendingPosts = useCachedFetch(url, 'trendingNotes', dataProcessor);

  return (
    <div class="mt-2 p-2 mx-2 md:mx-0 flex flex-col gap-4">
      <SearchBox
        focus={props.focus}
        onSelect={({ key }) => {
          route('/' + key);
        }}
      />
      <SmallFeed events={trendingPosts} />
      <FollowSuggestionsAPI />
    </div>
  );
};

export default Search;
