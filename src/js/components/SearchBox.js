import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {publicState, localState} from '../Main.js';
import Identicon from './Identicon.js';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import Fuse from '../lib/fuse.basic.esm.min.js';
import { followChatLink } from '../Chat.js';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class SearchBox extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.follows = {};
    this.state = {results:[]};
    this.debouncedIndexAndSearch = _.debounce(() => {
      const options = {keys: ['name'], includeScore: true, includeMatches: true, threshold: 0.3};
      this.fuse = new Fuse(Object.values(this.follows), options);
      this.search();
    }, 200);
  }

  addEntry(key, followDistance, follower) {
    if (this.follows[key]) {
      if (this.follows[key].followDistance > followDistance) {
        this.follows[key].followDistance = followDistance;
      }
      this.follows[key].followers.add(follower);
      return;
    }
    this.follows[key] = {key, followDistance, followers: new Set([follower])};
    this.hasFollows = this.hasFollows || Object.keys(this.follows).length > 1;
    publicState.user(key).get('profile').get('name').on((name, a, b, e) => {
      this.eventListeners[key] = e;
      this.follows[key].name = name;
      this.debouncedIndexAndSearch();
    });
  }

  getFollows(k, maxDepth = 2, currentDepth = 1) {
    this.addEntry(k, currentDepth - 1);
    publicState.user(k).get('follow').map().once((follows, key) => {
      if (follows) {
        this.addEntry(key, currentDepth, k);
        if (currentDepth < maxDepth) {
          this.getFollows(key, maxDepth, currentDepth + 1);
        }
      }
    });
  }

  onInput() {
    this.search();
  }

  close() {
    $(this.base).find('input').val('');
    this.setState({results:[], query: ''});
  }

  componentDidMount() {
    this.getFollows(Session.getKey().pub);
    localState.get('activeRoute').on((a,b,c,e) => {
      this.eventListeners['activeRoute'] = e;
      this.close();
    });
    this.adjustResultsPosition();
  }

  componentDidUpdate() {
    this.adjustResultsPosition();
  }

  adjustResultsPosition() {
    const input = $(this.base).find('input');
    this.offsetLeft = input[0].offsetLeft;
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  onSubmit(e) {
    e.preventDefault();
    const links = $(this.base).find('a:not(.follow-someone)');
    links.length && links[0].click();
    $(this.base).find('input').blur();
  }

  search() {
    const input = $(this.base).find('input');
    const query = input.val();

    if (followChatLink(query)) return;

    if (query && this.fuse) {
      const results = this.fuse.search(query).slice(0,5);
      if (results.length) {
        $(document).off('keyup').on('keyup', e => {
          if (e.key === "Escape") { // escape key maps to keycode `27`
            $(document).off('keyup');
            input.val('');
            this.setState({results:[], query: ''});
          }
        });
      }
      this.setState({results, query});
    } else {
      this.setState({results:[], query});
    }
  }

  onClick(e, item) {
    if (this.props.onSelect) {
      e.preventDefault();
      e.stopPropagation();
      this.props.onSelect(item);
    }
    this.close();
  }

  render() {
    return html`
      <div class="search-box">
        <form onSubmit=${e => this.onSubmit(e)}>
          <label>
            <input type="text" placeholder=${t('search')} onInput=${() => this.onInput()}/>
          </label>
        </form>
        <div class="search-box-results" style="left: ${this.offsetLeft || ''}">
          ${this.state.results.map(r => {
            const i = r.item;
            let followText = '';
            if (i.followDistance === 1) {
              followText = 'Following';
            }
            if (i.followDistance === 2) {
              if (i.followers.size === 1 && this.follows[[...i.followers][0]].name) {
                followText = 'Followed by ' + this.follows[[...i.followers][0]].name;
              } else {
                followText = 'Followed by ' + i.followers.size + ' users you follow';
              }
            }
            return html`
              <a href="/profile/${i.key}" onClick=${e => this.onClick(e, i)}>
                <${Identicon} str=${i.key} width=40/>
                <div>
                  ${i.name || ''}<br/>
                  <small>
                    ${followText}
                  </small>
                </div>
              </a>
            `;
          })}
          ${this.state.query && !this.hasFollows ? html`
            <a class="follow-someone">Follow someone to see more search results!</a>
            <a href="/profile/${suggestedFollow}" class="suggested">
              <${Identicon} str=${suggestedFollow} width=40/>
              <i>Suggested</i>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }
}

export default SearchBox;
