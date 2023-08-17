import { Event } from 'nostr-tools';
import { useState } from 'preact/hooks';
import styled from 'styled-components';

import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import Helpers from '../../utils/Helpers.tsx';
import Block from '../buttons/Block';
import { PrimaryButton } from '../buttons/Button';
import Copy from '../buttons/Copy';
import FollowButton from '../buttons/Follow';
import Dropdown from '../Dropdown';
import Modal from '../modal/Modal';

import EventRelaysList from './EventRelaysList';

interface EventDropdownProps {
  event?: Event;
  onTranslate?: (text: string) => void;
  id: string;
}

const EventDetail = styled.div`
  text-align: left;
  max-width: 100%;
  user-select: text;
`;

const EventDropdown = (props: EventDropdownProps) => {
  const { event, id } = props;

  const [muted] = useState<boolean>(false); // TODO setMuted
  const [showingDetails, setShowingDetails] = useState(false);

  const closeModal = () => setShowingDetails(false);

  const onBlock = () => {
    // TODO hide msg
  };

  const onDelete = (e: any) => {
    e.preventDefault();
    if (confirm('Delete message?')) {
      const hexId = Key.toNostrHexAddress(id);
      if (hexId) {
        Events.publish({
          kind: 5,
          content: 'deleted',
          tags: [['e', hexId]],
        });
        // TODO hide
      }
    }
  };

  const onMute = (e) => {
    e.preventDefault();
    localState.get('mutedNotes').get(props.id).put(!muted);
  };

  const report = (e) => {
    e.preventDefault();
    if (confirm('Publicly report and hide message?')) {
      const hexId = Key.toNostrHexAddress(props.id);
      if (hexId && props.event) {
        Events.publish({
          kind: 5,
          content: 'reported',
          tags: [
            ['e', hexId],
            ['p', props.event.pubkey],
          ],
        });
        // this.setState({ msg: null });
      }
    }
  };

  const translate = (e: any) => {
    e.preventDefault();
    props.event &&
      Helpers.translateText(props.event.content).then((res) => {
        props.onTranslate?.(res);
      });
  };

  const onBroadcast = (e: any) => {
    // republish message on nostr
    e.preventDefault();
    const hexId = Key.toNostrHexAddress(id);
    if (hexId) {
      const event = Events.db.get(hexId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', hexId, event);
        Events.publish(event);
      }
    }
  };

  const url = `https://iris.to/${Key.toNostrBech32Address(id, 'note')}`;

  return (
    <div>
      <Dropdown>
        <Copy className="btn btn-sm" key={`${id!}copy_link`} text={t('copy_link')} copyStr={url} />
        <Copy
          className="btn btn-sm"
          key={`${id!}copy_id`}
          text={t('copy_note_ID')}
          copyStr={Key.toNostrBech32Address(id, 'note') || ''}
        />
        <a className="btn btn-sm" href="#" onClick={onMute}>
          {muted ? t('unmute_notifications') : t('mute_notifications')}
        </a>
        {event ? (
          <>
            <a className="btn btn-sm" href="#" onClick={onBroadcast}>
              {t('resend_to_relays')}
            </a>
            <a className="btn btn-sm" href="#" onClick={translate}>
              {t('translate')}
            </a>
            <Copy
              className="btn btn-sm"
              key={`${id!}copyRaw`}
              text={t('copy_raw_data')}
              copyStr={JSON.stringify(event, null, 2)}
            />
            {event.pubkey === Key.getPubKey() ? (
              <a className="btn btn-sm" href="#" onClick={onDelete}>
                {t('delete')}
              </a>
            ) : (
              <>
                <a className="btn btn-sm" href="#" onClick={report}>
                  {t('report_public')}
                </a>
                <FollowButton className="btn btn-sm" id={event?.pubkey} />
                <Block
                  className="btn btn-sm"
                  onClick={onBlock}
                  id={event?.pubkey}
                  showName={true}
                />
              </>
            )}
            <a
              className="btn btn-sm"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowingDetails(true);
              }}
            >
              {t('event_detail')}
            </a>
          </>
        ) : (
          <></>
        )}
      </Dropdown>
      {event && showingDetails && (
        <Modal showContainer onClose={closeModal}>
          <EventDetail>
            <EventRelaysList event={event} />
            <PrimaryButton onClick={closeModal}>{t('done')}</PrimaryButton>
          </EventDetail>
        </Modal>
      )}
    </div>
  );
};

export default EventDropdown;
