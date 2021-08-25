import { html } from 'htm/preact';
import State from '../State.js';
import FeedMessageForm from '../components/FeedMessageForm.js';
import MessageFeed from '../components/MessageFeed.js';
import Filters from '../components/Filters.js';
import View from './View.js';
import SubscribeHashtagButton from "../components/SubscribeHashtagButton";
import Helmet from 'react-helmet';
import HashtagList from '../components/HashtagList';
import HashtagSubscriberList from '../components/HashtagSubscriberList';
import OnboardingNotification from "../components/OnboardingNotification";

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
        <div style="display:flex;flex-direction:row">
          <div style="flex:3">
            ${hashtag ? html`
              <${Helmet}>
                  <title>${hashtagText}</title>
                  <meta property="og:title" content="${hashtagText} | Iris" />
              <//>
              <h3>${hashtagText} <span style="float:right"><${SubscribeHashtagButton} key=${hashtag} id=${hashtag} /></span></h3>
            ` : ''}
            ${s.searchTerm ? '' : html`
              <${FeedMessageForm} key="form${path}" index=${path} class="hidden-xs" autofocus=${false}/>
            `}
            ${s.searchTerm ? html`<h2>Search results for "${s.searchTerm}"</h2>` : html`
              <${OnboardingNotification} />
            `}
            ${!s.noFollows ? html`<${Filters}/>` : ''}
            <${MessageFeed}
                    scrollElement=${this.scrollElement.current}
                    hashtag=${hashtag}
                    filter=${s.searchTerm && (m => this.filter(m))}
                    thumbnails=${this.props.thumbnails}
                    key=${hashtag || this.props.index || 'feed'}
                    group=${this.state.group}
                    path=${path} />
          </div>
          ${this.props.index === 'media' ? '':html`
            <div style="flex:1" class="hidden-xs">
              <${HashtagList} />
              ${this.props.hashtag ? html`<${HashtagSubscriberList} key=${this.props.hashtag} hashtag=${this.props.hashtag} />`:''}
            </div>
          `}
        </div>
      </div>
    `;
  }
}

export default Feed;
