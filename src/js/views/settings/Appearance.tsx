import { useEffect, useState } from 'preact/hooks';

import localState from '../../LocalState';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation.mjs';

type ColorScheme = 'default' | 'light' | 'dark';

const Appearance = () => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const [showConnectedRelays, setShowConnectedRelays] = useState(false);

  useEffect(() => {
    // TODO use Nostr.private
    Session.public?.get('settings/colorScheme', (entry) => {
      setColorScheme(entry.value);
    });
    localState.get('showConnectedRelays').on(setShowConnectedRelays);
  }, []);

  const onChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const value = target.value as ColorScheme;
    Session.public?.set('settings/colorScheme', value);
  };

  return (
    <>
      <div class="centered-container">
        <h3>{t('appearance')}</h3>
        <p>
          <label for="colorScheme">{t('color_scheme')}</label>
          <select
            className="select"
            id="colorScheme"
            name="colorScheme"
            onChange={onChange}
            value={colorScheme}
          >
            <option value="default">{t('system_default')}</option>
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
          </select>
        </p>
        <p>
          <input
            className="checkbox"
            type="checkbox"
            id="showConnectedRelays"
            name="showConnectedRelays"
            checked={showConnectedRelays}
            onChange={(e) => {
              localState.get('showConnectedRelays').put(e.currentTarget.checked);
            }}
          />
          <label className="label" htmlFor="showConnectedRelays">
            {t('show_connected_relays_in_header')}
          </label>
        </p>
      </div>
    </>
  );
};

export default Appearance;
