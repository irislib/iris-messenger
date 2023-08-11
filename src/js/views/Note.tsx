import { route } from 'preact-router';

import CreateNoteForm from '../components/create/CreateNoteForm';
import EventComponent from '../components/events/EventComponent';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';

class Note extends View {
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
        <div className="m-2">
          <CreateNoteForm
            placeholder={t('whats_on_your_mind')}
            forceAutoFocusMobile={true}
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
          showRepliedMsg={true}
          showReplies={Infinity}
        />
      );
    }
    return <div className="w-full">{content}</div>;
  }
}

export default Note;
