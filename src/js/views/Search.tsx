import { memo } from 'react';
import { nip19 } from 'nostr-tools';
import { Link, route } from 'preact-router';

import FollowButton from '../components/buttons/Follow';
import SmallFeed from '../components/feed/SmallFeed';
import SearchBox from '../components/SearchBox';
import Avatar from '../components/user/Avatar';
import Name from '../components/user/Name';
import useCachedFetch from '../hooks/useCachedFetch';
import { useProfile } from '../hooks/useProfile';
import Events from '../nostr/Events';
import Key from '../nostr/Key';

const SuggestionProfile = memo(({ pubkey }: { pubkey: string }) => {
  const profile = useProfile(pubkey);
  return (
    <Link
      href={`/${nip19.npubEncode(pubkey)}`}
      key={pubkey}
      className="flex flex-row gap-4 w-full break-words"
    >
      <span className="flex-shrink-0">
        <Avatar str={pubkey} width={30} />
      </span>
      <span className="flex-1">
        <b>
          <Name pub={pubkey} />
        </b>
        <br />
        <span className="text-neutral-400">
          {profile?.about?.slice(0, 100)}
          {profile?.about?.length > 100 ? '...' : ''}
        </span>
      </span>
      <span className="flex-shrink-0">
        <FollowButton className="btn btn-sm" id={pubkey} />
      </span>
    </Link>
  );
});

const FollowSuggestionsAPI = memo(() => {
  const url = `https://api.nostr.band/v0/suggested/profiles/${Key.getPubKey()}`;
  const suggestions = useCachedFetch(url, 'followSuggestions', (data) => data.profiles || []);

  if (!suggestions.length) return null;

  const randomSuggestions = suggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 8)
    .map((s) => s.pubkey);

  return (
    <div className="card-body p-2">
      <h2 className="card-title">Follow suggestions</h2>
      <hr className="opacity-10" />
      <div className="flex flex-wrap gap-4 items-center text-xs overflow-x-hidden">
        {randomSuggestions.map((pubkey: any) => (
          <SuggestionProfile key={pubkey} pubkey={pubkey} />
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
    <div class="sticky border-l border-neutral-900 top-0 right-0 px-4 py-2 mx-2 md:mx-0 flex flex-col gap-4 h-screen">
      <SearchBox
        focus={props.focus}
        onSelect={({ key }) => {
          route('/' + key);
        }}
      />
      <div className="max-h-[50vh] overflow-y-auto">
        <SmallFeed events={trendingPosts} />
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        <FollowSuggestionsAPI />
      </div>
    </div>
  );
};

export default Search;
