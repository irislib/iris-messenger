import Component from '../BaseComponent';
import { html } from 'htm/preact';
import {createRef} from 'preact';
import State from '../State.js';
import {Link} from "preact-router/match";
import {route} from 'preact-router';
import {translate as t} from '../Translation.js';

export default class HashtagList extends Component {
  constructor() {
    super();
    this.addHashtagInputRef = createRef();
    this.hashtagSubscribers = {};
    this.state = {hashtags: {}};
  }

  componentDidMount() {
    const hashtags = {};
    State.public.user().get('hashtagSubscriptions').map().on(this.sub(
      (isSubscribed, hashtag) => {
        if (isSubscribed) {
          hashtags[hashtag] = true;
        } else {
          delete hashtags[hashtag];
        }
        this.setState({hashtags});
      }
    ));
    State.group().map('hashtagSubscriptions', (isSubscribed, hashtag, a, b, from) => {
      if (!this.hashtagSubscribers[hashtag]) {
        this.hashtagSubscribers[hashtag] = new Set();
      }
      const subs = this.hashtagSubscribers[hashtag];
      isSubscribed ? subs.add(from) : subs.delete(from);
      const popularHashtags = Object.keys(this.hashtagSubscribers)
        .filter(k => this.hashtagSubscribers[k].size > 0)
        .filter(k => !hashtags[k])
        .sort((tag1,tag2) => {
          const set1 = this.hashtagSubscribers[tag1];
          const set2 = this.hashtagSubscribers[tag2];
          if (set1.size !== set2.size) {
            return set1.size > set2.size ? -1 : 1;
          }
          return tag1 > tag2 ? 1 : -1;
        }).slice(0,8);
      this.setState({popularHashtags});
    });
  }

  addHashtagClicked(e) {
    e.preventDefault();
    this.setState({showAddHashtagForm: !this.state.showAddHashtagForm});
  }

  onAddHashtag(e) {
    e.preventDefault();
    const hashtag = e.target.firstChild.value.replace('#', '').trim();
    if (hashtag) {
      State.public.user().get('hashtagSubscriptions').get(hashtag).put(true);
      this.setState({showAddHashtagForm: false});
      route(`/hashtag/${hashtag}`);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.showAddHashtagForm && this.state.showAddHashtagForm) {
      this.addHashtagInputRef.current && this.addHashtagInputRef.current.focus();
    }
  }

  shouldComponentUpdate() {
    return true;
  }

  render() {
    return html`
      <div class="msg hashtag-list">
        <div class="msg-content">
          ${this.state.showAddHashtagForm ? html`
            <form onSubmit=${e => this.onAddHashtag(e)}>
                <input placeholder="#hashtag" ref=${this.addHashtagInputRef} style="margin-bottom: 7px" />
                <button type="submit"> ${t('add')}</button>
                <button onClick=${() => this.setState({showAddHashtagForm:false})}>${t('cancel')}</button>
            </form><br/>
          ` : html`
            <a href="" onClick=${e => this.addHashtagClicked(e)}> ${t('add_hashtag')}</a><br/>
            `}
          <${Link} activeClassName="active" href="/"> ${t('all')}<//>
          ${Object.keys(this.state.hashtags).sort().map(hashtag =>
            html`<${Link} activeClassName="active" class="channel-listing" href="/hashtag/${hashtag}">#${hashtag}<//>`
            )}
        </div>
      </div>
      ${this.state.popularHashtags && this.state.popularHashtags.length ? html`
        <div class="msg hashtag-list">
          <div class="msg-content">
          ${t('popular_hashtags')}<br/><br/>

            ${this.state.popularHashtags.map(hashtag =>
              html`<${Link} activeClassName="active" class="channel-listing" href="/hashtag/${hashtag}">#${hashtag}<//>`
            )}
          </div>
        </div>
      `:''}
    `;
  }
}
