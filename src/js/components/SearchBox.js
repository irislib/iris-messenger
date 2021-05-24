import { Component } from '../lib/preact.js';
import { route } from '../lib/preact-router.es.js';
import Helpers, { html } from '../Helpers.js';
import State from '../State.js';
import Identicon from './Identicon.js';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import Fuse from '../lib/fuse.basic.esm.min.js';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class SearchBox extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = {results:[]};
    this.debouncedIndexAndSearch = _.debounce(() => {
      const options = {keys: ['name'], includeScore: true, includeMatches: true, threshold: 0.3};
      this.fuse = new Fuse(Object.values(Session.getFollows()), options); // TODO: this gets reinitialized with Header on each view change. slow?
      this.search();
    }, 200);
  }

  onInput() {
    this.search();
  }

  close() {
    $(this.base).find('input').val('');
    this.setState({results:[], query: ''});
  }

  componentDidMount() {
    State.local.get('follows').map().on(follows => {
      this.hasFollows = this.hasFollows || Object.keys(Session.getFollows()).length > 1;
      follows && this.debouncedIndexAndSearch();
    });
    State.local.get('activeRoute').on((a,b,c,e) => {
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
    const el = $(this.base).find('input');
    const query = el.val();
    el.val('');
    el.blur();
    route(`/search/${query}`);
  }

  search() {
    const query = $(this.base).find('input').val();
    if (!query) { return; }

    if (this.props.onSelect) {
      const s = query.split('https://iris.to/#/profile/');
      if (s.length > 1) {
        return this.props.onSelect({key: s[1]});
      }
      const key = Helpers.getUrlParameter('chatWith', s[1]);
      if (key) {
        return this.props.onSelect({key});
      }
    }
    if (Helpers.followChatLink(query)) return;

    if (query && this.fuse) {
      const results = this.fuse.search(query).slice(0,5);
      if (results.length) {
        $(document).off('keyup').on('keyup', e => {
          if (e.key === "Escape") { // escape key maps to keycode `27`
            $(document).off('keyup');
            this.close();
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
              if (i.followers.size === 1 && Session.getFollows()[[...i.followers][0]].name) {
                followText = 'Followed by ' + Session.getFollows()[[...i.followers][0]].name;
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
