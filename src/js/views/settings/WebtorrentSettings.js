import iris from 'iris-lib';

import Component from '../../BaseComponent';
import { translate as t } from '../../translations/Translation';

export default class WebtorrentSettings extends Component {
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
          <h3>Webtorrent</h3>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.enableWebtorrent}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('enableWebtorrent')
                  .put(!this.state.settings.enableWebtorrent)
              }
              id="enableWebtorrent"
            />
            <label htmlFor="enableWebtorrent">{t('enable_webtorrent')}</label>
          </p>
          <p>
            <input
              type="checkbox"
              checked={this.state.settings.autoplayWebtorrent}
              onChange={() =>
                iris
                  .local()
                  .get('settings')
                  .get('autoplayWebtorrent')
                  .put(!this.state.settings.autoplayWebtorrent)
              }
              id="autoplayWebtorrent"
            />
            <label for="autoplayWebtorrent">{t('autoplay_webtorrent_videos')}</label>
          </p>
        </div>
      </>
    );
  }
}
