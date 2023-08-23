import { memo } from 'react';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import EventDB from '@/nostr/EventDB';
import { EventID } from '@/utils/Hex/Hex.ts';

import Events from '../../nostr/Events';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Icons from '../../utils/Icons';

import Note from './note/Note';
import EventDropdown from './EventDropdown';
import Follow from './Follow';
import Like from './Like';
import Repost from './Repost';
import Zap from './Zap';

declare global {
  interface Window {
    prerenderReady: boolean;
  }
}

export interface EventComponentProps {
  id: string;
  standalone?: boolean;
  asInlineQuote?: boolean;
  showReplies?: number;
  showRepliedMsg?: boolean;
  isReply?: boolean;
  isQuote?: boolean;
  isQuoting?: boolean;
  feedOpenedAt?: number;
  fullWidth?: boolean;
}

const EventComponent = (props: EventComponentProps) => {
  const hex = useMemo(() => new EventID(props.id).hex, [props.id]);
  const [event, setEvent] = useState(EventDB.get(hex));
  const [retrieving, setRetrieving] = useState<boolean>(false);
  const retrievingTimeout = useRef<any>();
  const unmounted = useRef<boolean>(false);

  const handleEvent = (e: any) => {
    if (!e) {
      return;
    }

    clearTimeout(retrievingTimeout.current);
    if (unmounted.current) {
      return;
    }

    if (retrieving) {
      setRetrieving(false);
    }

    if (!event) {
      setEvent(e);
    }
  };

  useEffect(() => {
    if (props.standalone) {
      if (event) {
        window.prerenderReady = true;
      } else {
        setTimeout(() => {
          window.prerenderReady = true;
        }, 1000);
      }
    }
    if (!event) {
      retrievingTimeout.current = setTimeout(() => {
        setRetrieving(true);
      }, 1000);
      Events.getEventById(hex, true, (event) => handleEvent(event));
    }

    return () => {
      unmounted.current = true;
    };
  }, [props.id]);

  const renderDropdown = () => {
    return props.asInlineQuote ? null : <EventDropdown id={props.id || ''} event={event} />;
  };

  if (!event) {
    return (
      <div key={props.id}>
        <div
          className={`m-2 md:mx-4 flex items-center ${
            retrieving ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-700 ease-in-out`}
        >
          <div className="text">{t('looking_up_message')}</div>
          <div>{renderDropdown()}</div>
        </div>
      </div>
    );
  }

  if (SocialNetwork.isBlocked(event.pubkey)) {
    if (props.standalone || props.isQuote) {
      return (
        <div className="m-2 md:mx-4 flex items-center">
          <i className="mr-2">{Icons.newFollower}</i>
          <span> Message from a blocked user</span>
        </div>
      );
    } else {
      return null;
    }
  }

  const renderComponent = () => {
    let Component: any = Note;

    if (event.kind === 1) {
      const mentionIndex = event?.tags?.findIndex((tag) => tag[0] === 'e' && tag[3] === 'mention');
      if (event?.content === `#[${mentionIndex}]`) {
        Component = Repost;
      }
    } else {
      Component = {
        1: Note,
        3: Follow,
        6: Repost,
        7: Like,
        9735: Zap,
      }[event.kind];
    }

    if (!Component) {
      console.error('unknown event kind', event);
      return null;
    }

    return (
      <Component
        key={props.id}
        event={event}
        fullWidth={props.fullWidth}
        fadeIn={!props.feedOpenedAt || props.feedOpenedAt < event.created_at}
        {...props}
      />
    );
  };

  return renderComponent();
};

export default memo(EventComponent);
