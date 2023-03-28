import { route } from 'preact-router';

import EventComponent from '../components/events/EventComponent';
import FeedMessageForm from '../components/FeedMessageForm';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation';

import View from './View';

class Message extends View {
  constructor() {
    super();
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    const nostrBech32Id = Key.toNostrBech32Address(this.props.id, 'note');
    if (nostrBech32Id && this.props.id !== nostrBech32Id) {
      route(`/${nostrBech32Id}`, true);
      return;
    }
    this.restoreScrollPosition();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.restoreScrollPosition();
    }
  }

  renderView() {
    let content;
    if (this.props.id === 'new') {
      content = (
        <div className="mar-top15">
          <FeedMessageForm
            placeholder={t('whats_on_your_mind')}
            activeChat="public"
            forceAutofocusMobile={true}
            autofocus={true}
            onSubmit={() => route('/')}
          />
        </div>
      );
    } else {
      content = (
        <EventComponent
          id={this.props.id}
          key={this.props.id}
          standalone={true}
          showReplies={Infinity}
          showRepliedMsg={true}
        />
      );
    }
    return <div className="centered-container">{content}</div>;
  }
}

export default Message;
