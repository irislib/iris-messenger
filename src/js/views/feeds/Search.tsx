import FeedComponent from '@/components/feed/Feed';

import View from '../View';

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
    const filterFn = (event) => {
      // some relays don't support filtering by keyword
      return event.content.includes(this.props.keyword);
    };
    const filter = { kinds: [1], keywords: [this.props.keyword || ''] };
    return (
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <FeedComponent
            key={this.props.keyword}
            filterOptions={[
              {
                name: 'Search',
                filter,
                filterFn,
              },
            ]}
          />
        </div>
      </div>
    );
  }
}

export default Search;
