import { FC, useEffect, useState } from 'react';
import { Event } from 'nostr-tools';
import styled from 'styled-components';

import Events from '../../nostr/Events';
import { EventMetadata } from '../../nostr/EventsMeta';
import { translate as t } from '../../translations/Translation.mjs';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  & ul > li {
    font-size: large;
  }
  & ul > li:not(:last-child) {
    margin-bottom: 0.5rem;
  }
`;

const Codeblock = styled.pre`
  overflow: auto;
  background-color: hsl(0, 0%, 16%);
  [data-theme='light'] & {
    background-color: hsl(0, 0%, 88%);
  }
  max-height: 400px;
  border-radius: 4px;
  padding: 0.7rem;
  font-family: monospace;
`;

const EventRelaysList: FC<{ event: Event }> = ({ event }) => {
  const [eventMeta, setEventMeta] = useState(null as null | EventMetadata);

  useEffect(() => {
    if (!event?.id) {
      return;
    }
    const id = Events.getOriginalPostEventId(event);
    const val = id && Events.eventsMetaDb.get(id);
    if (val) {
      setEventMeta(val);
    }
  }, [event]);

  const relays = Array.from(eventMeta?.relays || []) as string[];

  return (
    <Wrapper>
      <h2>{t('event_detail')}</h2>
      <p>{t('seen_on')}</p>
      {relays.length === 0 ? (
        <p>{t('iris_api_source')}</p>
      ) : (
        <ul>
          {relays.map((r) => (
            <li>{r}</li>
          ))}
        </ul>
      )}
      <Codeblock>
        <code>{JSON.stringify({ ...event, meta: undefined, $loki: undefined }, null, 2)}</code>
      </Codeblock>
    </Wrapper>
  );
};

export default EventRelaysList;
