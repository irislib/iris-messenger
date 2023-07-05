import { route } from 'preact-router';

import SmallFeed from '../components/feed/SmallFeed';
import SearchBox from '../components/SearchBox';

import View from './View';

class Search extends View {
  constructor() {
    super();
    this.state = { trendingPosts: [] };
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
    fetch('https://api.nostr.band/v0/trending/notes')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.notes) return;
        this.setState({ trendingPosts: data.notes.map((e) => e.event) });
      });
  }

  renderView() {
    return (
      <div class="mt-2 mx-2 md:mx-0 flex flex-col gap-4">
        <SearchBox
          focus={true}
          onSelect={({ key }) => {
            route('/' + key);
          }}
        />
        <SmallFeed events={this.state.trendingPosts} />
      </div>
    );
  }
}

export default Search;
