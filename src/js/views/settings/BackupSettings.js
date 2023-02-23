import iris from 'iris-lib';

import Component from '../../BaseComponent';
import Identicon from '../../components/Identicon';
import Name from '../../components/Name';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';

export default class BackupSettings extends Component {
  render() {
    return (
      <>
        <div class="centered-container">
          <h2>{t('backup')}</h2>
          <h3>{t('import')}</h3>
          <p>
            <textarea onInput={(e) => this.onInput(e)} placeholder="[Event JSON]"></textarea>
          </p>
          {this.state.error && <p class="warning">{this.state.error}</p>}
          {this.state.importedEvents && (
            <p class="positive">
              {t('imported_{n}_events').replace('{n}', this.state.importedEvents)}
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

  onInput(event) {
    // validate json
    const text = event.target.value;
    if (!text || text.length === 0) {
      this.setState({ error: null, importedEvents: null, restoredFollows: null });
      return;
    }
    try {
      let json = JSON.parse(text);
      if (!Array.isArray(json)) {
        json = [json];
      }
      for (const event of json) {
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
      this.setState({ error: null, importedEvents: json.length });
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
}
