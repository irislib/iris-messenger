import iris from 'iris-lib';

import Component from '../../BaseComponent';
import { translate as t } from '../../translations/Translation';

export default class MediaSettings extends Component {
  constructor() {
    super();
    this.state = { settings: iris.session.DEFAULT_SETTINGS.local };
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = 'settings';
  }

  componentDidMount() {
    iris.local().get('settings').on(this.inject());
  }

  render() {
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
                iris
                  .local()
                  .get('settings')
                  .get('autoplayVideos')
                  .put(!this.state.settings.autoplayVideos)
              }
              id="autoplayVideos"
            />
            <label htmlFor="autoplayVideos">{t('autoplay_videos')}</label>
          </p>

          <h3>{t('embeds')}</h3>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.enableWebtorrent !== false}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('enableWebtorrent')
                  .put(!this.state.settings.enableWebtorrent)
              }
              id="enableWebtorrent"
            />
            <label htmlFor="enableWebtorrent">Webtorrent</label>
          </p>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.enableYoutube !== false}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('enableYoutube')
                  .put(!(this.state.settings.enableYoutube !== false))
              }
              id="enableYoutube"
            />
            <label htmlFor="enableYoutube">YouTube</label>
          </p>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.enableSpotify !== false}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('enableSpotify')
                  .put(!(this.state.settings.enableSpotify !== false))
              }
              id="enableSpotify"
            />
            <label htmlFor="enableSpotify">Spotify</label>
          </p>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.enableTidal !== false}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('enableTidal')
                  .put(!(this.state.settings.enableTidal !== false))
              }
              id="enableTidal"
            />
            <label htmlFor="enableTidal">Tidal</label>
          </p>
        </div>
      </>
    );
  }
}
