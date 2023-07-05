import { nip19 } from 'nostr-tools';
import { Link, route } from 'preact-router';

import SmallFeed from '../components/feed/SmallFeed';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import SearchBox from '../components/SearchBox';
import useCachedFetch from '../hooks/useCachedFetch';
import Events from '../nostr/Events';
import Key from '../nostr/Key';

const FollowSuggestionsAPI = () => {
  const url = `https://api.nostr.band/v0/suggested/profiles/${Key.getPubKey()}`;
  const suggestions = useCachedFetch(url, 'followSuggestions', (data) => data.profiles || []);

  if (!suggestions.length) return null;

  return (
    <div className="card-body p-4">
      <h2 className="card-title">Follow suggestions</h2>
      <hr className="opacity-10" />
      <div className="-ml-2 flex flex-wrap gap-2 text-xs overflow-y-scroll overflow-x-hidden max-h-screen">
        {suggestions.map((profile: any) => (
          <Link
            href={`/${nip19.npubEncode(profile.pubkey)}`}
            key={profile.pubkey}
            className="flex gap-2 w-full break-words"
          >
            <span className="flex-shrink-0">
              <Identicon str={profile.pubkey} width={30} />
            </span>
            <span className="w-full">
              <b>
                <Name pub={profile.pubkey} />
              </b>
              <br />
              <span className="text-neutral-400">{profile.bio}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

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
