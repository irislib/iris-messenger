import $ from 'jquery';
import { debounce } from 'lodash';
import isEqual from 'lodash/isEqual';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import FuzzySearch from '../FuzzySearch';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import Identicon from './Identicon';
import Name from './Name';
import SafeImg from './SafeImg';

const RESULTS_MAX = 5;

type Props = {
  onSelect?: (result: Pick<ResultItem, 'key'>) => void;
  query?: string;
  focus?: boolean;
  resultsOnly?: boolean;
  class?: string;
  tabIndex?: number;
};

type Result = {
  item: ResultItem;
};

type ResultItem = {
  key: string;
  followers: Map<string, unknown>;
  followDistance: number;
  name?: string;
  picture?: string;
  uuid?: string;
};

type State = {
  results: Array<Result>;
  query: string;
  showFollowSuggestions: boolean;
  offsetLeft: number;
  selected: number;
};

class SearchBox extends Component<Props, State> {
  constructor() {
    super();
    this.state = {
      results: [],
      query: '',
      showFollowSuggestions: true,
      offsetLeft: 0,
      selected: -1, // -1 - 'search by keyword'
    };
  }

  onInput() {
    this.search();
  }

  onKeyUp(e) {
    // up and down buttons
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();
      const selected = this.state.selected;
      let next = e.keyCode === 40 ? selected + 1 : selected - 1;
      next = Math.max(-1, Math.min(this.state.results.length - 1, next));
      this.setState({ selected: next });
    }
  }

  close() {
    $(this.base).find('input').val('');
    this.setState({ results: [], query: '' });
  }

  componentDidMount() {
    localState.get('showFollowSuggestions').on(this.inject());
    localState.get('searchIndexUpdated').on(this.sub(() => this.search()));
    localState.get('activeRoute').on(
      this.sub(() => {
        this.close();
      }),
    );
    this.adjustResultsPosition();
    this.search();
    $(document)
      .off('keydown')
      .on('keydown', (e) => {
        if (e.key === 'Tab' && document.activeElement?.tagName === 'BODY') {
          e.preventDefault();
          $(this.base).find('input').focus();
        } else if (e.key === 'Escape') {
          this.close();
          $(this.base).find('input').blur();
        }
      });
    this.props.focus && $(this.base).find('input')?.focus();
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
    if (
      this.state.selected >= 0 &&
      !isEqual(
        this.state.results.slice(0, this.state.selected + 1),
        prevState.results.slice(0, this.state.selected + 1),
      )
    ) {
      this.setState({ selected: -1 });
    }
  }

  // remove keyup listener on unmount
  componentWillUnmount() {
    $(document).off('keyup');
  }

  adjustResultsPosition() {
    const input = $(this.base).find('input');
    if (input.length) {
      this.setState({ offsetLeft: input[0].offsetLeft });
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const el = $(this.base).find('input');
    el.val('');
    el.trigger('blur');
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

  searchFromServer = debounce((query) => {
    fetch(`https://eu.rbr.bio/search/${query}.json`).then((res) => {
      res.json().then((json) => {
        if (json && Array.isArray(json)) {
          json.forEach((item) => {
            Events.handle(item[1]);
          });
        }
      });
    });
  }, 500);

  search() {
    let query = this.props.query || ($(this.base).find('input').first().val() as string) || '';
    query = query.toString().trim().toLowerCase();
    if (!query) {
      this.close();
      return;
    }
    if (query.match(/nsec1[a-zA-Z0-9]{30,65}/gi)) {
      $(this.base).find('input').first().val('');
      return;
    }

    if (this.props.onSelect) {
      // if matches email regex
      if (query.match(/.+@.+\..+/)) {
        Key.getPubKeyByNip05Address(query).then((pubKey) => {
          // if query hasn't changed since we started the request
          if (
            pubKey &&
            query === String(this.props.query || $(this.base).find('input').first().val())
          ) {
            this.props.onSelect?.({ key: pubKey });
          }
        });
      }

      if (query.startsWith('https://iris.to/')) {
        const path = query.replace('https://iris.to', '');
        route(path);
        return;
      }
      const noteMatch = query.match(/note[a-zA-Z0-9]{59,60}/gi);
      if (noteMatch) {
        route('/' + noteMatch[0]);
        return;
      }
      const npubMatch = query.match(/npub[a-zA-Z0-9]{59,60}/gi);
      if (npubMatch) {
        route('/' + npubMatch[0]);
        return;
      }
      const s = query.split('/profile/');
      if (s.length > 1) {
        return this.props.onSelect({ key: s[1] });
      }
      if (Key.toNostrHexAddress(query)) {
        return this.props.onSelect({ key: query });
      }
    }

    this.searchFromServer(query);

    if (query) {
      const results = FuzzySearch.search(query).slice(0, RESULTS_MAX);
      this.setState({ results, query });
    } else {
      this.setState({ results: [], query });
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

  onResultFocus(_e, index) {
    this.setState({ selected: index });
  }

  render() {
    return (
      <div className={`relative ${this.props.class}`}>
        {this.props.resultsOnly ? (
          ''
        ) : (
          <form onSubmit={(e) => this.onSubmit(e)}>
            <label>
              <input
                type="text"
                onKeyPress={(e) => this.preventUpDownDefault(e)}
                onKeyDown={(e) => this.preventUpDownDefault(e)}
                onKeyUp={(e) => this.onKeyUp(e)}
                placeholder={t('search')}
                tabIndex={1}
                onInput={() => this.onInput()}
                className="input-bordered border-neutral-500 input input-sm w-64"
              />
            </label>
          </form>
        )}
        <div
          onKeyUp={(e) => this.onKeyUp(e)}
          className={`${
            this.state.query ? '' : 'hidden'
          } absolute z-20 left-0 mt-2 w-full bg-black border border-neutral-700 rounded shadow-lg`}
        >
          {this.state.query && !this.props.resultsOnly ? (
            <a
              onFocus={(e) => this.onResultFocus(e, -1)}
              tabIndex={2}
              className={
                'p-2 cursor-pointer flex gap-2 items-center result ' +
                (-1 === this.state.selected ? 'selected bg-neutral-700' : '')
              }
              href={`/search/${encodeURIComponent(this.state.query)}`}
            >
              <div class="identicon-container">
                <div style="font-size: 1.5em; width: 40px">&#128269;</div>
              </div>
              <div>
                <span>{this.state.query}</span>
                <br />
                <small>{t('search_posts')}</small>
              </div>
            </a>
          ) : (
            ''
          )}
          {this.state.results.map((r, index) => {
            const i = r.item;
            let followText = '';
            if (i.followers) {
              if (i.followDistance === 0) {
                followText = t('you');
              } else if (i.followDistance === 1) {
                followText = t('following');
              } else {
                followText = `${i.followers.size} ${t('followers')}`;
              }
            }
            const npub = Key.toNostrBech32Address(i.key, 'npub');
            return (
              <a
                onFocus={(e) => this.onResultFocus(e, index)}
                tabIndex={2}
                className={
                  'p-2 cursor-pointer flex gap-2 items-center result ' +
                  (index === this.state.selected ? 'selected bg-neutral-700' : '')
                }
                href={`/${npub}`}
                onClick={(e) => this.onClick(e, i)}
              >
                {i.picture ? (
                  <SafeImg src={i.picture} className="rounded-full" width={40} />
                ) : (
                  <Identicon key={`${npub}ic`} str={npub} width={40} />
                )}
                <div>
                  <Name pub={i.key} key={i.key + 'searchResult'} />
                  <br />
                  <small>{followText}</small>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }
}

export default SearchBox;
