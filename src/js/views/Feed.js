import { html } from 'htm/preact';

import FeedComponent from '../components/Feed';
import FeedMessageForm from '../components/FeedMessageForm';
import OnboardingNotification from '../components/OnboardingNotification';
import localState from '../LocalState';
import { translate as t } from '../translations/Translation';

import View from './View';

class Feed extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = { sortedMessages: [], group: 'follows' };
    this.messages = {};
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
    localState.get('filters').get('group').on(this.inject());
  }

  renderView() {
    let path = this.props.index || 'msgs';
    return html`
      <div class="centered-container">
        <div style="display:flex;flex-direction:row">
          <div style="flex:3;width: 100%">
            ${this.props.keyword
              ? ''
              : html`
                  <${FeedMessageForm}
                    placeholder=${t('whats_on_your_mind')}
                    key="form${path}"
                    class="hidden-xs"
                    autofocus=${false}
                  />
                `}
            ${this.props.keyword
              ? html`<h2>${t('search')}: "${this.props.keyword}"</h2>`
              : html` <${OnboardingNotification} /> `}
            <${FeedComponent}
              scrollElement=${this.scrollElement.current}
              keyword=${this.props.keyword}
              key=${this.props.index || 'feed'}
              index=${this.props.index}
              path=${path}
            />
          </div>
        </div>
      </div>
    `;
  }
}

export default Feed;
