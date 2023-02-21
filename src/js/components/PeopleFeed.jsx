import iris from 'iris-lib';
import { throttle } from 'lodash';

import Component from '../BaseComponent';
import Button from '../components/basic/Button';
import Helpers from '../Helpers';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import PublicMessage from './PublicMessage';

const INITIAL_PAGE_SIZE = 20;

let isInitialLoad = true;
const listener = function () {
  isInitialLoad = false;
  window.removeEventListener('popstate', listener);
};
window.addEventListener('popstate', listener);

class PeopleFeed extends Component {
  constructor() {
    super();
    this.state = {
      sortedPeople: [],
      queuedPeople: [],
      displayCount: INITIAL_PAGE_SIZE,
      peopleShownTime: Math.floor(Date.now() / 1000),
    };
    this.mappedPeople = new Map();
  }

  updateSortedPeople = throttle(
    (sortedPeople) => {
      if (this.unmounted || !sortedPeople) {
        return;
      }
      // iterate over sortedPeople and add newer than peopleShownTime to queue
      const queuedPeople = [];
      let hasMyPeople;
      for (let i = 0; i < sortedPeople.length; i++) {
        const hash = sortedPeople[i];
        const profile = Nostr.profiles.get(hash);
        if (profile && profile.created_at > this.state.peopleShownTime) {
          if (profile.pubkey === iris.session.getKey().secp256k1.rpub && !Nostr.isBoost(profile)) {
            hasMyPeople = true;
            break;
          }
          queuedPeople.push(hash);
        }
      }
      if (!hasMyPeople) {
        sortedPeople = sortedPeople.filter((hash) => !queuedPeople.includes(hash));
      }
      const peopleShownTime = hasMyPeople
        ? Math.floor(Date.now() / 1000)
        : this.state.peopleShownTime;
      this.setState({ sortedPeople, queuedPeople, peopleShownTime });
      this.checkScrollPosition();
    },
    3000,
    { leading: true },
  );

  handleScroll = () => {
    // increase page size when scrolling down
    if (this.state.displayCount < this.state.sortedPeople.length) {
      if (
        this.props.scrollElement.scrollTop + this.props.scrollElement.clientHeight >=
        this.props.scrollElement.scrollHeight - 500
      ) {
        this.setState({ displayCount: this.state.displayCount + INITIAL_PAGE_SIZE });
      }
    }
    this.checkScrollPosition();
  };

  checkScrollPosition = () => {
    // if scrolled past this.base element's start, apply fixedTop class to it
    if (!this.props.scrollElement) {
      return;
    }
    const showNewPeopleFixedTop = this.props.scrollElement.scrollTop > this.base.offsetTop - 60;
    if (showNewPeopleFixedTop !== this.state.fixedTop) {
      this.setState({ showNewPeopleFixedTop });
    }
  };

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.props.scrollElement) {
      this.props.scrollElement.removeEventListener('scroll', this.handleScroll);
    }
  }

  addScrollHandler() {
    if (this.props.scrollElement) {
      this.props.scrollElement.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillMount() {
    if (!isInitialLoad && window.history.state?.state) {
      this.setState(window.history.state.state);
    }
  }

  componentDidMount() {
    this.addScrollHandler();
    let first = true;
    iris
      .local()
      .get('scrollUp')
      .on(
        this.sub(() => {
          !first && Helpers.animateScrollTop('.main-view');
          first = false;
        }),
      );
    if (this.props.keyword) {
      const keyword = this.props.keyword;
      Nostr.getPeopleByKeyword(this.props.keyword, (people) => {
        console.log('people');
        console.log(people);
        console.log('people');
        if (this.props.keyword == keyword) this.updateSortedPeople(people);
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.scrollElement && this.props.scrollElement) {
      this.addScrollHandler();
    }
    window.history.replaceState({ ...window.history.state, state: this.state }, '');
    if (!this.state.queuedPeople.length && prevState.queuedPeople.length) {
      Helpers.animateScrollTop('.main-view');
    }
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (
      prevNodeId !== newNodeId ||
      this.props.group !== prevProps.group ||
      this.props.path !== prevProps.path ||
      this.props.filter !== prevProps.filter ||
      this.props.keyword !== prevProps.keyword
    ) {
      this.mappedPeople = new Map();
      this.setState({ sortedPeople: [] });
      this.componentDidMount();
    }
  }

  showQueuedPeople = (e) => {
    const sortedPeople = this.state.sortedPeople;
    sortedPeople.unshift(...this.state.queuedPeople);
    this.setState({
      sortedPeople,
      queuedPeople: [],
      peopleShownTime: Math.floor(Date.now() / 1000),
      displayCount: INITIAL_PAGE_SIZE,
    });
  };

  render() {
    if (!this.props.scrollElement || this.unmounted) {
      return;
    }
    const displayCount = this.state.displayCount;
    const showRepliedMsg = this.props.index !== 'likes' && !this.props.keyword;
    const feedName =
      !this.state.queuedPeople.length &&
      {
        everyone: 'global_feed',
        follows: 'following',
        notifications: 'notifications',
      }[this.props.index];

    return (
      <>
        <div>
          {this.state.queuedPeople.length ? (
            <div
              className={`msg ${this.state.showNewPeopleFixedTop ? 'fixedTop' : ''}`}
              onClick={this.showQueuedPeople}
            >
              <div className="msg-content notification-msg colored">
                {t('show_n_new_messages').replace('{n}', this.state.queuedPeople.length)}
              </div>
            </div>
          ) : null}
          {feedName ? (
            <div className="msg">
              <div className="msg-content notification-msg">{t(feedName)}</div>
            </div>
          ) : null}
          {this.state.sortedPeople.slice(0, displayCount).map((hash) => (
            <PublicMessage key={hash} hash={hash} showName={true} showRepliedMsg={showRepliedMsg} />
          ))}
        </div>
        {displayCount < this.state.sortedPeople.length ? (
          <p>
            <Button
              onClick={() =>
                this.setState({
                  displayCount: displayCount + INITIAL_PAGE_SIZE,
                })
              }
            >
              {t('show_more')}
            </Button>
          </p>
        ) : (
          ''
        )}
      </>
    );
  }
}

export default PeopleFeed;
