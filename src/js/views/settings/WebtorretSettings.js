import { html } from 'htm/preact';
import Helpers from '../../Helpers';
import _ from 'lodash';
import State from '../../State';
import Session from '../../Session';
import Component from '../../BaseComponent';
import {ExistingAccountLogin} from '../Login';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';

export default class WebtorretSettings extends Component {

  constructor() {
    super();
    this.state = Session.DEFAULT_SETTINGS;
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = "settings";
  }

  render() {
    return (
        <>
        <div class="centered-container">
        <h3>{t('webtorrent')}</h3>
        <p><input type="checkbox" checked={this.state.local.enableWebtorrent} onChange={() => State.local.get('settings').get('enableWebtorrent').put(!this.state.local.enableWebtorrent)} id="enableWebtorrent"/><label for="enableWebtorrent">{t('automatically_load_webtorrent_attachments')}</label></p>
        <p><input type="checkbox" checked={this.state.local.autoplayWebtorrent} onChange={() => State.local.get('settings').get('autoplayWebtorrent').put(!this.state.local.autoplayWebtorrent)} id="autoplayWebtorrent"/><label for="autoplayWebtorrent">{t('autoplay_webtorrent_videos')}</label></p>
        <hr/>
        </div>
        </>
    );
  }
  
}
