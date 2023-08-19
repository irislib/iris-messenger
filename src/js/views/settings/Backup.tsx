import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router';

import EventDB from '@/nostr/EventDB';

import Copy from '../../components/buttons/Copy';
import Follow from '../../components/buttons/Follow';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import Events from '../../nostr/Events';
import IndexedDB from '../../nostr/IndexedDB';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';

const Backup = () => {
  const [eventCount, setEventCount] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [downloadMyEventsMessage, setDownloadMyEventsMessage] = useState('');
  const [downloadAllEventsMessage, setDownloadAllEventsMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [importedEvents, setImportedEvents] = useState<any>(null);
  const [restoredFollows, setRestoredFollows] = useState<any>(null);

  useEffect(() => {
    const fetchEventCount = async () => {
      try {
        const count = await IndexedDB.db.events.count();
        setEventCount(count);
      } catch (error) {
        console.error('Error fetching event count:', error);
      }
    };

    fetchEventCount(); // Fetch the count immediately on mount

    const interval = setInterval(fetchEventCount, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval); // Clear the timer on unmount
    };
  }, []);

  const profileExportJson = () => {
    const myPub = Key.getPubKey();
    let rawDataJson = [] as any;
    const profileEvent = EventDB.findOne({ kinds: [0], authors: [myPub] });
    const followEvent = EventDB.findOne({ kinds: [3], authors: [myPub] });
    profileEvent && rawDataJson.push(profileEvent);
    followEvent && rawDataJson.push(followEvent);
    rawDataJson = JSON.stringify(rawDataJson, null, 2);
    return rawDataJson;
  };

  const exportMyEvents = async () => {
    setDownloadMyEventsMessage('Exporting my events...');
    const pubkey = Key.getPubKey();
    try {
      const events = await IndexedDB.db.events.where({ pubkey }).toArray();
      setSaveMessage(`Exported ${events.length} events associated with the current pubkey`);
      setDownloadMyEventsMessage('');
      return JSON.stringify(events);
    } catch (error) {
      console.error('Error exporting my events:', error);
      setDownloadMyEventsMessage('Error fetching events.');
    }
  };

  const exportAllEvents = async () => {
    setDownloadAllEventsMessage('Exporting all events...');
    try {
      const events = await IndexedDB.db.events.toArray();
      setSaveMessage(`Exported ${events.length} total events`);
      setDownloadAllEventsMessage('');
      return JSON.stringify(events);
    } catch (error) {
      console.error('Error exporting all events:', error);
      setDownloadAllEventsMessage('Error fetching events.');
    }
  };

  // onClickDownload function
  const onClickDownload = async (filename: string, textFn: () => Promise<string | void>) => {
    try {
      setSaveMessage('');
      setSaveError('');
      const text = await textFn();
      if (!text) {
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(text);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', filename);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e: any) {
      console.error(e);
      setSaveError(e.message);
      setDownloadMyEventsMessage('');
    }
  };

  // onUploadJsonClick function
  const onUploadJsonClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          // 'reader.result' contains the content of the file
          importJson(reader.result as string);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // importJson function
  const importJson = (text: string) => {
    if (!text || text.length === 0) {
      setLoadError('');
      setImportedEvents(null);
      setRestoredFollows(null);
      return;
    }
    try {
      let json = JSON.parse(text);
      if (!Array.isArray(json)) {
        json = [json];
      }
      for (const event of json) {
        if (!event.sig) {
          continue; // we don't want to sign & publish unsigned events
        }
        requestAnimationFrame(() => {
          Events.handle(event, true);
          Events.publish(event);
        });
        const myPub = Key.getPubKey();
        // even if it's an old contacts event by us, restore follows from it
        if (event.pubkey === myPub && event.kind === 3) {
          const followed = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
          const currentFollows = (EventDB.findOne({ kinds: [3], authors: [myPub] })?.tags || [])
            .filter((t) => t[0] === 'p')
            .map((t) => t[1]);
          const newRestoredFollows = followed.filter((f) => !currentFollows.includes(f));
          SocialNetwork.setFollowed(newRestoredFollows);
          setRestoredFollows(newRestoredFollows);
        }
      }
      setLoadError('');
      setImportedEvents(json.length);
    } catch (e: any) {
      setLoadError(e.message);
    }
  };

  return (
    <>
      <h2>{t('backup')}</h2>

      <h3>{t('save')}</h3>
      <p>
        {t('profile')} & {t('follows')}:
      </p>
      <p>
        <button
          className="btn btn-sm btn-neutral"
          onClick={() => onClickDownload('nostr-my-profile-and-follows.json', profileExportJson)}
        >
          {t('download')}
        </button>
        <Copy
          key={`${Key.getPubKey()}copyData`}
          text={t('copy_raw_data')}
          copyStr={profileExportJson}
        />
      </p>
      <p>{t('your_events')}:</p>
      <p>
        <button
          className="btn btn-sm btn-neutral"
          onClick={() => onClickDownload('nostr-my-events.json', exportMyEvents)}
        >
          {downloadMyEventsMessage || t('download')}
        </button>
      </p>
      <p>
        {t('all_locally_stored_events')} ({eventCount}):
      </p>
      <p>
        <button
          className="btn btn-sm btn-neutral"
          onClick={() => onClickDownload('nostr-all-events.json', exportAllEvents)}
        >
          {downloadAllEventsMessage || t('download')}
        </button>
      </p>
      {saveMessage && <p>{saveMessage}</p>}
      {saveError && <p className="warning">{saveError}</p>}

      <h3>{t('load')}</h3>
      <p>
        <button className="btn btn-sm btn-neutral" onClick={onUploadJsonClick}>
          Upload .json file
        </button>
      </p>
      <p>
        <textarea
          className="textarea w-96 max-w-full border-2 border-purple-900"
          onInput={(e) => importJson((e.target as HTMLTextAreaElement).value)}
          placeholder={t('paste_event_json')}
        ></textarea>
      </p>
      {loadError && <p class="warning">{loadError}</p>}
      {importedEvents && (
        <p class="positive">
          {t('loaded_and_published_{n}_events').replace('{n}', `${importedEvents}`)}
        </p>
      )}
      {restoredFollows && (
        <>
          <p class="positive">
            {t('restored_{n}_follows').replace('{n}', `${restoredFollows.length}`)}
          </p>
          {restoredFollows.map((hex) => (
            <div className="profile-link-container">
              <Link href={`/${Key.toNostrBech32Address(hex, 'npub')}`} className="profile-link">
                <Avatar str={hex} width={40} />
                <Name pub={hex} />
              </Link>
              <Follow id={hex} />
            </div>
          ))}
        </>
      )}
    </>
  );
};

export default Backup;
