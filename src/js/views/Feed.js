import { html } from 'htm/preact';
import State from '../State.js';
import PublicMessageForm from '../components/PublicMessageForm.js';
import MessageFeed from '../components/MessageFeed.js';
import Filters from '../components/Filters.js';
import View from './View.js';
import SubscribeHashtagButton from "../components/SubscribeHashtagButton";
import Helmet from 'react-helmet';

class Feed extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = {sortedMessages: [], group: "follows"};
    this.messages = {};
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  search() {
    const searchTerm = this.props.term && this.props.term.toLowerCase();
    this.setState({searchTerm});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.term !== this.props.term) {
      this.search();
    }
  }

  componentDidMount() {
    this.search();
    if (this.props.hashtag) {
      State.local.get('filters').get('group').put('everyone');
    }
    State.local.get('filters').get('group').on(this.inject());
  }

  filter(msg) {
    if (this.state.searchTerm) {
      return msg.text && (msg.text.toLowerCase().indexOf(this.state.searchTerm) > -1);
    }
    return true;
  }

  renderView() {
    const s = this.state;
    let path = this.props.index || 'msgs';
    const hashtag = this.props.hashtag;
    const hashtagText = `#${hashtag}`;
    if (hashtag) {
      path = `hashtags/${hashtag}`;
    }
    return html`
      <div class="centered-container">
        ${hashtag ? html`
            <${Helmet}>
                <title>${hashtagText}</title>
                <meta property="og:title" content="${hashtagText} | Iris" />
            <//>
            <h3>${hashtagText} <span style="float:right"><${SubscribeHashtagButton} id=${hashtag} /></span></h3>
            
        ` : ''}
        ${s.searchTerm ? '' : html`
          <${PublicMessageForm} index=${path} class="hidden-xs" autofocus=${false}/>
        `}
        ${s.searchTerm ? html`<h2>Search results for "${s.searchTerm}"</h2>` : html`
          ${this.getNotification()}
        `}
        ${s.hasFollows ? html`<${Filters}/>` : ''}
        <${MessageFeed}
                scrollElement=${this.scrollElement.current}
                hashtag=${hashtag}
                filter=${s.searchTerm && (m => this.filter(m))}
                thumbnails=${this.props.thumbnails}
                key=${hashtag || this.props.index || 'feed'}
                group=${this.state.group}
                path=${path} />
      </div>
    `;
  }
}

export default Feed;
