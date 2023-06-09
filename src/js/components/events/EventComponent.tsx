import { useEffect, useRef, useState } from 'preact/hooks';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';

import EventDropdown from './EventDropdown';
import Follow from './Follow';
import Like from './Like';
import Note from './Note';
import NoteImage from './NoteImage';
import Repost from './Repost';
import Zap from './Zap';

declare global {
  interface Window {
    prerenderReady: boolean;
  }
}

interface EventComponentProps {
  id?: string;
  standalone?: boolean;
  asInlineQuote?: boolean;
  showReplies?: number;
  showRepliedMsg?: boolean;
  isReply?: boolean;
  isQuote?: boolean;
  isQuoting?: boolean;
  renderAs?: 'NoteImage';
  feedOpenedAt?: number;
  fullWidth?: boolean;
}

const EventComponent = (props: EventComponentProps) => {
  const [state, setState] = useState<{ [key: string]: any }>({
    sortedReplies: [],
  });
  const subscriptions: (() => void)[] = [];
  const retrievingTimeout = useRef<any>();
  const unmounted = useRef<boolean>(false);

  const handleEvent = (event: any) => {
    clearTimeout(retrievingTimeout.current);
    if (unmounted.current) {
      return;
    }

    if (state.retrieving) {
      setState((prevState) => ({ ...prevState, retrieving: false }));
    }

    const replyingTo = Events.getNoteReplyingTo(event);

    const meta = {
      npub: Key.toNostrBech32Address(event.pubkey, 'npub'),
      noteId: Key.toNostrBech32Address(event.id, 'note'),
      time: event.created_at * 1000,
      isMine: Key.getPubKey() === event.pubkey,
      attachments: [],
      replyingTo,
    };

    setState((prevState) => ({ ...prevState, event, meta }));
  };

  useEffect(() => {
    if (!props.id) {
      console.log('error: no id', props);
      return;
    }
    unmounted.current = false;
    setState((prevState) => ({ prevState, meta: { id: props.id } }));
    const hexId = Key.toNostrHexAddress(props.id);

    /*
    localState.get('mutedNotes').on(
      (mutedNotes) => {
        const muted = mutedNotes && mutedNotes[hexId];
        setState((prevState) => ({ ...prevState, muted }));
      },
      // ...
    );
     */

    retrievingTimeout.current = setTimeout(() => {
      setState((prevState) => ({ ...prevState, retrieving: true }));
    }, 1000);
    hexId && Events.getEventById(hexId, true, (event) => handleEvent(event));

    return () => {
      subscriptions.forEach((unsub) => {
        unsub();
      });
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (props.standalone) {
      if (!state.msg && state.msg) {
        setTimeout(() => {
          window.prerenderReady = true;
        }, 1000);
      }
    }
  });

  const renderDropdown = () => {
    return props.asInlineQuote ? null : <EventDropdown id={props.id || ''} event={state.event} />;
  };

  const getClassName = () => {
    let className = 'msg';
    if (props.standalone) className += ' standalone';
    const isQuote = props.isQuote || (props.showReplies && state.sortedReplies?.length);
    if (isQuote) className += ' quote';
    return className;
  };

  if (!props.id) {
    console.error('no id on event', props);
    return null;
  }
  if (!state.event) {
    return (
      <div key={props.id} className={getClassName()}>
        <div
          className={`msg-content retrieving ${state.retrieving ? 'visible' : ''}`}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <div className="text">{t('looking_up_message')}</div>
          <div>{renderDropdown()}</div>
        </div>
      </div>
    );
  }

  if (SocialNetwork.blockedUsers.has(state.event.pubkey)) {
    if (props.standalone || props.isQuote) {
      return (
        <div className="msg">
          <div className="msg-content">
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <i style={{ marginRight: '15px' }}>{Icons.newFollower}</i>
              <span> Message from a blocked user</span>
            </p>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  const renderComponent = () => {
    let Component: any = Note;

    if (state.event.kind === 1) {
      const mentionIndex = state.event?.tags?.findIndex(
        (tag) => tag[0] === 'e' && tag[3] === 'mention',
      );
      if (state.event?.content === `#[${mentionIndex}]`) {
        Component = Repost;
      }
    } else {
      Component = {
        1: Note,
        3: Follow,
        6: Repost,
        7: Like,
        9735: Zap,
      }[state.event.kind];
    }

    if (props.renderAs === 'NoteImage') {
      Component = NoteImage;
    }

    if (!Component) {
      console.error('unknown event kind', state.event);
      return null;
    }

    return (
      <Component
        key={props.id}
        className={getClassName()}
        event={state.event}
        meta={state.meta}
        fullWidth={props.fullWidth}
        fadeIn={!props.feedOpenedAt || props.feedOpenedAt < state.event.created_at}
        {...props}
      />
    );
  };

  return renderComponent();
};

export default EventComponent;
