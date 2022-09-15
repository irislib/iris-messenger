import Component from '../BaseComponent';
import { route } from 'preact-router';
import Helpers from '../Helpers';
import State from '../State';
import Identicon from './Identicon';
import Text from './Text';
import {translate as t} from '../translations/Translation';
import Session from '../Session';
import $ from 'jquery';
import _ from 'lodash';
import SafeImg from './SafeImg';

const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

type Props = {
  onSelect?: (result: Object) => void;
  query?: string;
  focus?: boolean;
  resultsOnly?: boolean;
  class?: string;
};

type Result = {
  item: ResultItem;
}

type ResultItem = {
    key: string;
    followers: Map<string, any>;
    followDistance: number;
    name?: string;
    photo?: string;
    uuid?: string;
}

type State = {
  results: Array<Result>;
  query: string;
  noFollows: boolean;
  offsetLeft: number;
}

class SearchBox extends Component<Props, State> {
  debouncedIndexAndSearch = _.debounce(() => {
    this.search();
  }, 200);

  constructor() {
    super();
    this.state = {results:[], query: '', noFollows: true, offsetLeft: 0};
  }

  onInput() {
    this.search();
  }

  close() {
    $(this.base).find('input').val('');
    this.setState({results:[], query: ''});
  }

  componentDidMount() {
    State.local.get('noFollows').on(this.inject());
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
      this.setState({offsetLeft: input[0].offsetLeft});
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const el = $(this.base).find('input');
    const query = el.val();
    el.val('');
    el.blur();
    // TODO go to first result
    const selected = $(this.base).find('.search-box-results a.selected');
    if (selected.length) {
      selected[0].click();
    }
  }

  search() {
    const query = this.props.query || $(this.base).find('input')[0].value;
    if (!query) {
      this.close();
      return;
    }

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
      const results = Session.getSearchIndex().search(query).slice(0,5);
      if (results.length) {
        $(document).off('keyup').on('keyup', e => {
          if (e.key === "Escape") { // escape key maps to keycode `27`
            $(document).off('keyup');
            this.close();
          }
          // up and down buttons
          else if (e.keyCode === 38 || e.keyCode === 40) {
            e.preventDefault();
            const selected = $(this.base).find('.search-box-results a.selected');
            if (selected.length) {
              const next = e.keyCode === 38 ? selected.prev() : selected.next();
              if (next.length) {
                selected.removeClass('selected');
                next.addClass('selected');
              }
            } else {
              $(this.base).find('.search-box-results a').first().addClass('selected');
            }
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
        <div class="search-box-results" style="left: ${this.state.offsetLeft || ''}">
          {this.state.results.map((r, index) => {
            const i = r.item;
            let followText = '';
            if (i.followDistance === 1) {
              followText = 'Following';
            }
            if (i.followDistance > 1) {
              /*
              if (i.followers.size === 1 && Session.getFollows()[[...i.followers][0]] && Session.getFollows()[[...i.followers][0]].name) {
                followText = `Followed by ${  Session.getFollows()[[...i.followers][0]].name}`;
              } else {
                followText = `${  i.followers.size  } followers`;
              }
              */
              followText = `${  i.followers.size  } followers`;
            }
            return (
              <a className={index === 0 ? 'selected' : ''} href={i.uuid ? `/group/${i.uuid}` : `/profile/${i.key}`} onClick={e => this.onClick(e, i)}>
                {i.photo ? <div class="identicon-container"><img src={i.photo} class="round-borders" height={40} width={40} alt=""/></div> : <Identicon key={`${i.key  }ic`} str={i.key} width={40} />}
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
