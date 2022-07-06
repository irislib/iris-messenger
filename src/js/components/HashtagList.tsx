import Component from '../BaseComponent';
import {Fragment, createRef, RefObject, JSX} from 'preact';
import State from '../State';
import {Link} from "preact-router/match";
import {route} from 'preact-router';
import {translate as t} from '../Translation';

type Props = {};

type State = {
  showAddHashtagForm: boolean;
  hashtags: Object;
  popularHashtags: string[];
}

export default class HashtagList extends Component<Props, State> {
  hashtagSubscribers: Object;
  addHashtagInputRef: RefObject<HTMLInputElement>;

  constructor() {
    super();
    this.addHashtagInputRef = createRef();
    this.hashtagSubscribers = {};
    this.state = {
      hashtags: {},
      showAddHashtagForm: undefined,
      popularHashtags: undefined,
    };
  }

  componentDidMount() {
    const hashtags = {};
    State.public.user().get('hashtagSubscriptions').map().on(this.sub(
      (isSubscribed: boolean, hashtag: string) => {
        if (hashtag.indexOf('~') === 0) { return; }
        if (isSubscribed) {
          hashtags[hashtag] = true;
        } else {
          delete hashtags[hashtag];
        }
        this.setState({hashtags});
      }
    ));
    State.group().map('hashtagSubscriptions', this.sub((isSubscribed, hashtag, a, b, from) => {
      if (hashtag.indexOf('~') === 0) { return; }
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
    }));
  }

  addHashtagClicked(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    this.setState({showAddHashtagForm: !this.state.showAddHashtagForm});
  }

  onAddHashtag(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    const hashtag = ((e.target as HTMLFormElement).firstChild as HTMLInputElement).value.replace('#', '').trim();
    if (hashtag) {
      State.public.user().get('hashtagSubscriptions').get(hashtag).put(true);
      this.setState({showAddHashtagForm: false});
      route(`/hashtag/${hashtag}`);
    }
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (!prevState.showAddHashtagForm && this.state.showAddHashtagForm) {
      this.addHashtagInputRef.current && this.addHashtagInputRef.current.focus();
    }
  }

  shouldComponentUpdate() {
    return true;
  }

  render() {
    return (
      <Fragment>
        <div className="msg hashtag-list">
          <div className="msg-content">
            {this.state.showAddHashtagForm ? (
              <Fragment>
                <form onSubmit={e => this.onAddHashtag(e)}>
                    <input placeholder="#hashtag" ref={this.addHashtagInputRef} style="margin-bottom: 7px" />
                    <button type="submit">{t('add')}</button>
                    <button onClick={() => this.setState({showAddHashtagForm:false})}>{t('cancel')}</button>
                </form>
                <br/>
              </Fragment>
            ) : (
              <Fragment>
                <a href="" onClick={e => this.addHashtagClicked(e)}>{t('add_hashtag')}</a>
                <br/>
              </Fragment>
            )}
            <Link activeClassName="active" href="/">{t('all')}</Link>
            {Object.keys(this.state.hashtags).sort().map(hashtag =>
              <Link activeClassName="active" className="channel-listing" href={`/hashtag/${hashtag}`}>#{hashtag}</Link>
            )}
          </div>
        </div>
        {this.state.popularHashtags && this.state.popularHashtags.length ? (
          <div className="msg hashtag-list">
            <div className="msg-content">
            {t('popular_hashtags')}<br/><br/>
              {this.state.popularHashtags.map(hashtag =>
                <Link activeClassName="active" className="channel-listing" href={`/hashtag/${hashtag}`}>#{hashtag}</Link>
              )}
            </div>
          </div>
        ):null}
      </Fragment>
    );
  }
}
