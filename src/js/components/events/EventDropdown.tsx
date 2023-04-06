import { useState } from 'preact/hooks';

import { Event } from '../../lib/nostr-tools';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Block from '../buttons/Block';
import Copy from '../buttons/Copy';
import FollowButton from '../buttons/Follow';
import Dropdown from '../Dropdown';

interface EventDropdownProps {
  event?: Event & { id: string };
  id: string;
}

const EventDropdown = (props: EventDropdownProps) => {
  const { event, id } = props;

  const [muted, setMuted] = useState<boolean>(false);

  const onBlock = (_e: any) => {
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

  const onMute = (e: any) => {
    // TODO mute
  };

  const report = (e: any) => {
    // TODO report
  };

  const translate = (e: any) => {
    // TODO translate
  };

  const onBroadcast = (e: any) => {
    // republish message on nostr
    e.preventDefault();
    const hexId = Key.toNostrHexAddress(id);
    if (hexId) {
      const event = Events.db.by('id', hexId);
      if (event) {
        // TODO indicate to user somehow
        console.log('broadcasting', hexId);
        Events.publish(event);
      }
    }
  };

  const url = `https://iris.to/${Key.toNostrBech32Address(id, 'note')}`;

  return (
    <div className="msg-menu-btn">
      <Dropdown>
        <Copy key={`${id!}copy_link`} text={t('copy_link')} copyStr={url} />
        <Copy
          key={`${id!}copy_id`}
          text={t('copy_note_ID')}
          copyStr={Key.toNostrBech32Address(id, 'note')}
        />
        <a href="#" onClick={onMute}>
          {muted ? t('unmute') : t('mute')}
        </a>
        {event && (
          <>
            <a href="#" onClick={onBroadcast}>
              {t('resend_to_relays')}
            </a>
            <a href="#" onClick={translate}>
              {t('translate')}
            </a>
            <Copy
              key={`${id!}copyRaw`}
              text={t('copy_raw_data')}
              copyStr={JSON.stringify(event, null, 2)}
            />
            {event.pubkey === Key.getPubKey() ? (
              <a href="#" onClick={onDelete}>
                {t('delete')}
              </a>
            ) : (
              <>
                <a href="#" onClick={report}>
                  {t('report_public')}
                </a>
                <FollowButton id={event?.pubkey} />
                <span onClick={onBlock}>
                  <Block id={event?.pubkey} showName={true} />
                </span>
              </>
            )}
          </>
        )}
      </Dropdown>
    </div>
  );
};

export default EventDropdown;
