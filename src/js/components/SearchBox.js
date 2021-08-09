import Component from '../BaseComponent';
import { route } from 'preact-router';
import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import State from '../State.js';
import Identicon from './Identicon.js';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import $ from 'jquery';
import _ from 'lodash';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class SearchBox extends Component {
  constructor() {
    super();
    this.state = {results:[]};
    this.debouncedIndexAndSearch = _.debounce(() => {
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
    State.local.get('groups').get('everyone').map().on(this.sub(
      () => {
        this.hasFollows = this.hasFollows || Object.keys(Session.getFollows()).length > 1;
      }
    ));
    State.local.get('activeRoute').on(this.sub(
      () => {
        this.close();
      }
    ));
    this.adjustResultsPosition();
  }

  componentDidUpdate() {
    this.adjustResultsPosition();
  }

  adjustResultsPosition() {
    const input = $(this.base).find('input');
    this.offsetLeft = input[0].offsetLeft;
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
      const s = query.split('https://iris.to/profile/');
      if (s.length > 1) {
        return this.props.onSelect({key: s[1]});
      }
      const key = Helpers.getUrlParameter('chatWith', s[1]);
      if (key) {
        return this.props.onSelect({key});
      }
    }
    if (Session.followChatLink(query)) return;

    if (query) {
      const results = Session.getUserSearchIndex().search(query).slice(0,5);
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
              if (i.followers.size === 1 && Session.getFollows()[[...i.followers][0]] && Session.getFollows()[[...i.followers][0]].name) {
                followText = `Followed by ${  Session.getFollows()[[...i.followers][0]].name}`;
              } else {
                followText = `Followed by ${  i.followers.size  } users you follow`;
              }
            }
            return html`
              <a href="/profile/${i.key}" onClick=${e => this.onClick(e, i)}>
                <${Identicon} key=${`${i.key  }ic`} str=${i.key} width=40/>
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
