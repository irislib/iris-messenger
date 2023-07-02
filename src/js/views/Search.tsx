import { route } from 'preact-router';

import SearchBox from '../components/SearchBox';

import View from './View';

class Search extends View {
  constructor() {
    super();
    this.state = { sortedMessages: [] };
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
  }

  renderView() {
    return (
      <div class="mt-2 mx-2 md:mx-0">
        <SearchBox
          focus={true}
          onSelect={({ key }) => {
            route('/' + key);
          }}
        />
      </div>
    );
  }
}

export default Search;
