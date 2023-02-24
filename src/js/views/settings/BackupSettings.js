import iris from 'iris-lib';

import Component from '../../BaseComponent';
import Button from '../../components/basic/Button';
import CopyButton from '../../components/CopyButton';
import Identicon from '../../components/Identicon';
import Name from '../../components/Name';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';

export default class BackupSettings extends Component {
  profileExportJson() {
    const myPub = iris.session.getKey().secp256k1.rpub;
    let rawDataJson = [];
    const profileEvent = Nostr.profileEventByUser.get(myPub);
    const followEvent = Nostr.followEventByUser.get(myPub);
    profileEvent && rawDataJson.push(profileEvent);
    followEvent && rawDataJson.push(followEvent);
    rawDataJson = JSON.stringify(rawDataJson, null, 2);
    return rawDataJson;
  }

  async exportMyEvents() {
    console.log('exporting my events');
    const pubkey = Nostr.getPubKey();
    const events = [];
    let i = 0;
    this.setState({ downloadMyEventsMessage: 'Fetching events...' });
    await Nostr.idb.events.where({ pubkey }).each((event) => {
      events.push(event);
      i++;
    });
    this.setState({ saveMessage: `Found ${i} events`, downloadMyEventsMessage: null });
    return JSON.stringify(events);
  }

  render() {
    return (
      <>
        <div class="centered-container">
          <h2>{t('backup')}</h2>
          <h3>{t('save')}</h3>
          <p>
            {t('profile')} & {t('follows')}:
          </p>
          <p>
            <Button
              onClick={() =>
                this.onClickDownload('nostr-my-profile-and-follows.json', () =>
                  this.profileExportJson(),
                )
              }
            >
              {t('download')}
            </Button>
            <CopyButton
              key={`${this.state.hexPub}copyData`}
              text={t('copy_raw_data')}
              title={this.state.name}
              copyStr={() => this.profileExportJson()}
            />
          </p>
          <p>{t('your_events')}. Is slow dog but should eventually download the file:</p>
          <p>
            <Button
              onClick={() =>
                this.onClickDownload('nostr-my-events.json', () => this.exportMyEvents())
              }
            >
              {this.state.downloadMyEventsMessage || t('download')}
            </Button>
          </p>
          {this.state.saveMessage && <p>{this.state.saveMessage}</p>}
          {this.state.saveError && <p class="warning">{this.state.saveError}</p>}

          <h3>{t('load')}</h3>
          <p>
            <Button onClick={() => this.onUploadJsonClick()}>Upload .json file</Button>
          </p>
          <p>
            <textarea
              onInput={(e) => this.import(e.target.value)}
              placeholder={t('paste_event_json')}
            ></textarea>
          </p>
          {this.state.loadError && <p class="warning">{this.state.loadError}</p>}
          {this.state.importedEvents && (
            <p class="positive">
              {t('loaded_and_published_{n}_events').replace('{n}', this.state.importedEvents)}
            </p>
          )}
          {this.state.restoredFollows && (
            <>
              <p class="positive">
                {t('restored_{n}_follows').replace('{n}', this.state.restoredFollows.length)}
              </p>
              {this.state.restoredFollows.map((hex) => (
                <div className="profile-link-container">
                  <a href={`/${Nostr.toNostrBech32Address(hex, 'npub')}`} className="profile-link">
                    <Identicon str={hex} width={40} />
                    <Name pub={hex} />
                  </a>
                </div>
              ))}
            </>
          )}
        </div>
      </>
    );
  }

  async onClickDownload(filename, textFn) {
    try {
      this.setState({ saveMessage: null, saveError: null });
      const text = await textFn();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(text);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', filename);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error(e);
      this.setState({ saveError: e.message, downloadMyEventsMessage: null });
    }
  }

  onUploadJsonClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.import(e.target.result);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  import(text) {
    if (!text || text.length === 0) {
      this.setState({ loadError: null, importedEvents: null, restoredFollows: null });
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
        Nostr.publish(event);
        const myPub = iris.session.getKey().secp256k1.rpub;
        // even if it's an old contacts event by us, restore follows from it
        if (event.pubkey === myPub && event.kind === 3) {
          const followed = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
          const currentFollows = (Nostr.followEventByUser.get(myPub)?.tags || [])
            .filter((t) => t[0] === 'p')
            .map((t) => t[1]);
          const restoredFollows = followed.filter((f) => !currentFollows.includes(f));
          Nostr.setFollowed(restoredFollows);
          this.setState({ restoredFollows });
        }
      }
      this.setState({ loadError: null, importedEvents: json.length });
    } catch (e) {
      this.setState({ loadError: e.message });
    }
  }
}
