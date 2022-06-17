import register from 'preact-custom-element';
import {Component} from 'preact';
import {html} from 'htm/preact';
import {Row, Col} from 'jsxstyle/preact';
import util from '../util';
import Key from '../Key';
import Identicon from './Identicon.js';
import Fuse from 'fuse.js';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class Search extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = {results: []};
    this.follows = {};
    this.debouncedIndexAndSearch = util.debounce(() => {
      const options = {keys: ['name'], includeScore: true, includeMatches: true, threshold: 0.3};
      this.fuse = new Fuse(Object.values(this.follows), options);
      this.search();
    }, 200);
    Key.getDefault().then(key => {
      this.key = key;
      util.getPublicState().user().auth(key);
      this.getFollowsFn(() => this.debouncedIndexAndSearch());
    });
  }

  onInput() {
    this.search();
  }

  close() {
    this.base.querySelector('input').value = '';
    this.setState({results: [], query: ''});
  }

  getFollowsFn(callback, k, maxDepth = 2, currentDepth = 1) {
    k = k || this.key.pub;

    const addFollow = (k, followDistance, follower) => {
      if (this.follows[k]) {
        if (this.follows[k].followDistance > followDistance) {
          this.follows[k].followDistance = followDistance;
        }
        this.follows[k].followers.add(follower);
      } else {
        this.follows[k] = {key: k, followDistance, followers: new Set([follower])};
        util.getPublicState().user(k).get('profile').get('name').on(name => {
          this.follows[k].name = name;
          callback(k, this.follows[k]);
        });
      }
      callback(k, this.follows[k]);
    };

    addFollow(k, currentDepth - 1);

    util.getPublicState().user(k).get('follow').map().once((isFollowing, followedKey) => { // TODO: .on for unfollow
      if (isFollowing) {
        this.hasFollows = true;
        addFollow(followedKey, currentDepth, k);
        if (currentDepth < maxDepth) {
          this.getFollowsFn(callback, followedKey, maxDepth, currentDepth + 1);
        }
      }
    });

    return this.follows;
  }

  componentDidMount() {
    this.adjustResultsPosition();
  }

  componentDidUpdate() {
    this.adjustResultsPosition();
  }

  adjustResultsPosition() {
    const input = this.base.querySelector('input');
    this.offsetLeft = input.offsetLeft;
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  onSubmit(e) {
    e.preventDefault();
    const links = this.base.querySelector('a:not(.follow-someone)');
    links.length && links[0].click();
    this.base.querySelector('input').blur();
  }

  search() {
    const query = this.base.querySelector('input').value;

    if (this.props['on-select']) {
      const s = query.split('https://iris.to/profile/');
      if (s.length > 1) {
        return this.props['on-select']({key: s[1]});
      }
      const key = null;//Helpers.getUrlParameter('chatWith', s[1]);
      if (key) {
        return this.props['on-select']({key});
      }
    }
    //if (followChatLink(query)) return;

    if (query && this.fuse) {
      const results = this.fuse.search(query).slice(0, 5);
      if (results.length) {
        const onKeyUp = e => {
          if (e.key === 'Escape') { // escape key maps to keycode `27`
            document.removeEventListener('keyup', onKeyUp);
            this.close();
          }
        };
        document.removeEventListener('keyup', onKeyUp);
        document.addEventListener('keyup', onKeyUp);
      }
      this.setState({results, query});
    } else {
      this.setState({results: [], query});
    }
  }

  onClick(e, item) {
    this.close();
    const onSelect = this.props.onSelect || window.onIrisSearchSelect;
    if (onSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(item);
    }
  }

  render() {
    return html`
      <div class="iris-search-box" style="position: relative;">
        <form onSubmit=${e => this.onSubmit(e)}>
          <label>
            <input class="${this.props['inner-class'] || ''}" type="text" placeholder="Search" onInput=${() => this.onInput()}/>
          </label>
        </form>
        <${Col} class="search-box-results" style="position: absolute; background-color: white; border: 1px solid #eee; border-radius: 8px; left: ${this.offsetLeft || ''}">
          ${this.state.results.map(r => {
    const i = r.item;
    let followText = '';
    if (i.followDistance === 1) {
      followText = 'Following';
    }
    if (i.followDistance === 2) {
      if (i.followers.size === 1 && this.follows[[...i.followers][0]] && this.follows[[...i.followers][0]].name) {
        followText = `Followed by ${  this.follows[[...i.followers][0]].name}`;
      } else {
        followText = `Followed by ${  i.followers.size  } users you follow`;
      }
    }
    return html`
              <a style="width: 300px; display: flex; padding: 5px; flex-direction: row" href="https://iris.to/profile/${i.key}" onClick=${e => this.onClick(e, i)}>
                <${Identicon} user=${i.key} width=40/>
                <${Col} marginLeft="5px">
                  ${i.name || ''}<br/>
                  <small>
                    ${followText}
                  </small>
                <//>
              <//>
            `;
  })}
          ${this.state.query && !this.hasFollows ? html`
            <a class="follow-someone" style="padding:5px;">Follow someone to see more search results</a>
            <a style="width: 300px; display: flex; padding: 5px; flex-direction: row" onClick=${e => this.onClick(e, {key: suggestedFollow})} href="https://iris.to/profile/${suggestedFollow}" class="suggested">
              <${Identicon} user=${suggestedFollow} width=40/>
              <${Row} alignItems="center" marginLeft="5px"><i>Suggested</i><//>
            </a>
          ` : ''}
        <//>
      </div>
    `;
  }
}

!util.isNode && register(Search, 'iris-search', ['on-select', 'inner-class']);

export default Search;
