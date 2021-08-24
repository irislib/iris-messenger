import Component from '../BaseComponent';
import { html } from 'htm/preact';
import {createRef} from 'preact';
import State from '../State.js';
import {Link} from "preact-router/match";

export default class HashtagList extends Component {
  constructor() {
    super();
    this.addHashtagInputRef = createRef();
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
  }

  addHashtagClicked(e) {
    e.preventDefault();
    this.setState({showAddHashtagForm: !this.state.showAddHashtagForm});
  }

  onAddHashtag(e) {
    e.preventDefault();
    const hashtag = e.target.firstChild.value.replace('#', '');
    console.log(hashtag);
    if (hashtag) {
      State.public.user().get('hashtagSubscriptions').get(hashtag).put(true);
      this.setState({showAddHashtagForm: false});
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
                <button type="submit">Add</button>
                <button onClick=${() => this.setState({showAddHashtagForm:false})}>Cancel</button>
            </form><br/>  
          ` : html`
            <a href="" onClick=${e => this.addHashtagClicked(e)}>+ Add hashtag</a><br/>          
          `}
          <${Link} activeClassName="active" href="/">All<//>
          ${Object.keys(this.state.hashtags).sort().map(hashtag =>
            html`<${Link} activeClassName="active" class="channel-listing" href="/hashtag/${hashtag}">#${hashtag}<//>`
            )}
        </div>
      </div>
    `;
  }
}
