import Component from '../BaseComponent';
import Helpers from '../Helpers';
import iris from 'iris-lib';
import Identicon from './Identicon';
import Text from './Text';
import {translate as t} from '../translations/Translation';
import $ from 'jquery';
import _ from 'lodash';

const RESULTS_MAX = 5;
const suggestedFollow = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

type Props = {
  onSelect?: (result: Object) => void;
  query?: string;
  focus?: boolean;
  resultsOnly?: boolean;
  class?: string;
  tabIndex?: number;
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
  selected: number;
}

class SearchBox extends Component<Props, State> {
  constructor() {
    super();
    this.state = {results:[], query: '', noFollows: true, offsetLeft: 0, selected: 0};
  }

  onInput(_e) {
    this.search();
  }

  onKeyUp(e) {
    // up and down buttons
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();
      const selected = this.state.selected;
      let next = e.keyCode === 40 ? selected + 1 : selected - 1;
      next = Math.max(0, Math.min(this.state.results.length - 1, next));
      this.setState({selected: next});
    }
  }

  close() {
    $(this.base).find('input').val('');
    this.setState({results:[], query: ''});
  }

  componentDidMount() {
    iris.local().get('noFollows').on(this.inject());
    iris.local().get('searchIndexUpdated').on(this.sub(
        () => this.search()
    ));
    iris.local().get('activeRoute').on(this.sub(
      () => {
        this.close();
      }
    ));
    this.adjustResultsPosition();
    this.search();
    $(document).off('keydown').on('keydown', (e) => {
      if (e.key === "Tab" && document.activeElement.tagName === 'BODY') {
          e.preventDefault();
          $(this.base).find('input').focus();
      } else if (e.key === "Escape") {
        this.close();
        $(this.base).find('input').blur();
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.adjustResultsPosition();
    if (prevProps.focus !== this.props.focus) {
      $(this.base).find('input:visible').focus();
    }
    if (prevProps.query !== this.props.query) {
      this.search();
    }
    // if first 5 results are different, set selected = 0
    if (!_.isEqual(this.state.results.slice(0, this.state.selected + 1), prevState.results.slice(0, this.state.selected + 1))) {
      this.setState({selected: 0});
    }
  }

  // remove keyup listener on unmount
  componentWillUnmount() {
    $(document).off('keyup');
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
    const selected = $(this.base).find('.result.selected');
    if (selected.length) {
      selected[0].click();
    }
  }

  preventUpDownDefault(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();
    }
  }

  search() {
    const query = String(this.props.query || $(this.base).find('input').first().val());
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
    if (Helpers.followChatLink(query)) return;

    if (query) {
      const results = iris.session.getSearchIndex().search(query).slice(0,RESULTS_MAX);
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

  onResultFocus(e, index) {
    this.setState({selected: index});
  }

  render() {
    return (
      <div class={`search-box ${this.props.class}`}>
        {this.props.resultsOnly ? '' : (
          <form onSubmit={e => this.onSubmit(e)}>
            <label>
                <input type="text"
                       onKeyPress={e => this.preventUpDownDefault(e)}
                       onKeyDown={e => this.preventUpDownDefault(e)}
                       onKeyUp={e => this.onKeyUp(e)}
                       placeholder={t('search')}
                       tabIndex={1}
                       onInput={(e) => this.onInput(e)}/>
            </label>
          </form>
        )}
        <div onKeyUp={e => this.onKeyUp(e)} class="search-box-results" style="left: ${this.state.offsetLeft || ''}">
          {this.state.results.map((r, index) => {
            const i = r.item;
            let followText = '';
            if (i.followers) {
              if (i.followDistance === 0) {
                followText = 'You';
              } else if (i.followDistance === 1) {
                followText = 'Following';
              } else {
                followText = `${  i.followers.size  } followers`;
              }
            }
            return (
              <a onFocus={e => this.onResultFocus(e, index)} tabIndex={2} className={'result ' + (index === this.state.selected ? 'selected' : '')} href={i.uuid ? `/group/${i.uuid}` : `/profile/${i.key}`} onClick={e => this.onClick(e, i)}>
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
