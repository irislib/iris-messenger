import { memo, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import EventDB from '@/nostr/EventDB';
import { isRepost } from '@/nostr/utils.ts';
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

const COMPONENTS_BY_EVENT_KIND = {
  1: Note,
  3: Follow,
  6: Repost,
  7: Like,
  9735: Zap,
};

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
    if (e) {
      clearTimeout(retrievingTimeout.current);
      if (!unmounted.current) {
        setRetrieving(false);
        setEvent(e);
      }
    }
  };

  useEffect(() => {
    //console.log('EventComponent init'); // this gets called more than displayCount - unnecessary?
    if (props.standalone && (event || retrievingTimeout.current)) {
      window.prerenderReady = true;
    }
    if (!event) {
      retrievingTimeout.current = setTimeout(() => setRetrieving(true), 1000);
      Events.getEventById(hex, true, handleEvent);
    }

    return () => {
      unmounted.current = true;
    };
  }, [props.id]);

  const loadingClass = classNames('m-2 md:mx-4 flex items-center', {
    'opacity-100': retrieving,
    'opacity-0': !retrieving,
  });

  if (!event) {
    return (
      <div key={props.id} className={loadingClass}>
        <div className="text">{t('looking_up_message')}</div>
        {props.asInlineQuote ? null : <EventDropdown id={props.id || ''} event={event} />}
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
    }
    return null;
  }

  const Component: any = isRepost(event) ? Repost : COMPONENTS_BY_EVENT_KIND[event.kind];

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

export default memo(EventComponent);
