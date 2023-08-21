import { useEffect, useState } from 'react';

import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';

export default function Content() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const unsubscribe = localState.get('settings').on((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  const noteSettings = [
    // { setting: 'enableMarkdown', label: 'Markdown' },
    { setting: 'loadReactions', label: 'Replies and reactions' },
    { setting: 'showLikes', label: 'Likes' },
    { setting: 'showZaps', label: 'Zaps' },
    { setting: 'showReposts', label: 'Reposts' },
  ];

  const mediaSettings = [
    { setting: 'enableImages', label: 'Images' },
    { setting: 'enableAudio', label: 'Audio' },
    { setting: 'enableVideo', label: 'Videos' },
    { setting: 'autoplayVideos', label: 'Autoplay videos' },
    { setting: 'enableAppleMusic', label: 'Apple Music' },
    { setting: 'enableInstagram', label: 'Instagram' },
    { setting: 'enableSoundCloud', label: 'SoundCloud' },
    { setting: 'enableSpotify', label: 'Spotify' },
    { setting: 'enableTidal', label: 'Tidal' },
    { setting: 'enableTiktok', label: 'TikTok' },
    { setting: 'enableTwitch', label: 'Twitch' },
    { setting: 'enableTwitter', label: 'Twitter' },
    { setting: 'enableYoutube', label: 'YouTube' },
    { setting: 'enableWavlake', label: 'Wavlake' },
  ];

  const handleChange = (setting) => {
    localState
      .get('settings')
      .get(setting)
      .put(!(settings[setting] !== false));
  };

  return (
    <div class="centered-container">
      <h2>{t('content')}</h2>

      <h3>{t('notes')}</h3>
      {noteSettings.map(({ setting, label }) => (
        <p key={setting}>
          <input
            type="checkbox"
            checked={settings[setting] !== false}
            onChange={() => handleChange(setting)}
            id={setting}
          />
          <label htmlFor={setting}> {label}</label>
        </p>
      ))}

      <h3>{t('media')}</h3>
      {mediaSettings.map(({ setting, label }) => (
        <p key={setting}>
          <input
            type="checkbox"
            checked={settings[setting] !== false}
            onChange={() => handleChange(setting)}
            id={setting}
          />
          <label htmlFor={setting}> {label}</label>
        </p>
      ))}
    </div>
  );
}
