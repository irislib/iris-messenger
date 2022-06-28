import Component from '../BaseComponent';
import { route } from 'preact-router';
import Helpers from '../Helpers';
import State from '../State';
import Identicon from './Identicon';
import Text from './Text';
import {translate as t} from '../Translation';
import Session from '../Session';
import $ from 'jquery';
import _ from 'lodash';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

type Props = {
  onSelect?: (key: string) => void;
  query?: string;
  focus?: boolean;
  resultsOnly?: boolean;
  class?: string;
};

type State = {
  results: Array<Object>;
  query: string;
  noFollows: boolean;
}

class SearchBox extends Component<Props, State> {
  debouncedIndexAndSearch = _.debounce(() => {
    this.search();
  }, 200);

  constructor() {
    super();
    this.state = {results:[], query: '', noFollows: true};
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
        if (this.state.noFollows && Object.keys(Session.getFollows()).length > 1) {
          this.setState({noFollows: false});
        }
      }
    ));
    State.local.get('activeRoute').on(this.sub(
      () => {
        this.close();
      }
    ));
    this.adjustResultsPosition();
    this.search();
  }

  componentDidUpdate(prevProps) {
    this.adjustResultsPosition();
    if (prevProps.focus !== this.props.focus) {
      $(this.base).find('input:visible').focus();
    }
    if (prevProps.query !== this.props.query) {
      this.search();
    }
  }

  adjustResultsPosition() {
    const input = $(this.base).find('input');
    if (input.length) {
      this.offsetLeft = input[0].offsetLeft;
    }
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
    const query = this.props.query || $(this.base).find('input').val();
    if (!query) { return; }

    if (this.props.onSelect) {
      const s = query.split('/profile/');
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
    return (
      <div class={`search-box ${this.props.class}`}>
        {this.props.resultsOnly ? '' : (
          <form onSubmit={e => this.onSubmit(e)}>
            <label>
              <input type="text" placeholder={t('search')} onInput={() => this.onInput()}/>
            </label>
          </form>
        )}
        <div class="search-box-results" style="left: ${this.offsetLeft || ''}">
          {this.state.results.map(r => {
            const i = r.item;
            let followText = '';
            if (i.followDistance === 1) {
              followText = 'Following';
            }
            if (i.followDistance > 1) {
              if (i.followers.size === 1 && Session.getFollows()[[...i.followers][0]] && Session.getFollows()[[...i.followers][0]].name) {
                followText = `Followed by ${  Session.getFollows()[[...i.followers][0]].name}`;
              } else {
                followText = `${  i.followers.size  } followers`;
              }
            }
            return (
              <a href={`/profile/${i.key}`} onClick={e => this.onClick(e, i)}>
                <Identicon key={`${i.key  }ic`} str={i.key} width={40} />
                <div>
                  {i.name || ''}<br/>
                  <small>
                    {followText}
                  </small>
                </div>
              </a>
            );
          })}
          {this.state.query && this.state.noFollows ? (
            <>
              <a class="follow-someone">Follow someone to see more search results!</a>
              <a href={`/profile/${suggestedFollow}`} class="suggested">
                <Identicon str={suggestedFollow} width={40}/>
                <div>
                  <Text user={suggestedFollow} path="profile/name" /><br/>
                  <small>Suggested</small>
                </div>
              </a>
            </>
          ) : ''}
        </div>
      </div>
    );
  }
}

export default SearchBox;
