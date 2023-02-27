import Component from '../../BaseComponent';
import localState from '../../LocalState';
import { translate as t } from '../../translations/Translation';

export default class MediaSettings extends Component {
  constructor() {
    super();
    this.id = 'settings';
    this.state = {
      settings: {},
    };
  }

  componentDidMount() {
    localState.get('settings').on(this.inject());
  }

  render() {
    const embedSettings = [
      { setting: 'enableWebtorrent', label: 'Webtorrent' },
      { setting: 'enableYoutube', label: 'YouTube' },
      { setting: 'enableInstagram', label: 'Instagram' },
      { setting: 'enableSpotify', label: 'Spotify' },
      { setting: 'enableTidal', label: 'Tidal' },
      { setting: 'enableTwitch', label: 'Twitch' },
    ];
    return (
      <>
        <div class="centered-container">
          <h2>{t('media')}</h2>
          <h3>{t('playback')}</h3>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.autoplayVideos !== false}
              onChange={() =>
                localState
                  .get('settings')
                  .get('autoplayVideos')
                  .put(!(this.state.settings.autoplayVideos !== false))
              }
              id="autoplayVideos"
            />
            <label htmlFor="autoplayVideos">{t('autoplay_videos')}</label>
          </p>

          <h3>{t('embeds')}</h3>
          {embedSettings.map(({ setting, label }) => (
            <p key={setting}>
              <input
                type="checkbox"
                checked={this.state.settings[setting] !== false}
                onChange={() =>
                  localState
                    .get('settings')
                    .get(setting)
                    .put(!(this.state.settings[setting] !== false))
                }
                id={setting}
              />
              <label htmlFor={setting}>{label}</label>
            </p>
          ))}
        </div>
      </>
    );
  }
}
