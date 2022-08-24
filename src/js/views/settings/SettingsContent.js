import Component from '../../BaseComponent';

import AccountSettings from './AccountSettings';
import KeySettings from './KeySettings';
import PeerSettings from './PeerSettings';
import LanguageSettings from './LanguageSettings';
import WebtorrentSettings from './WebtorrentSettings';
import WebRTCSettings from './WebRTCSettings';
import BetaSettings from './BetaSettings';
import BlockedSettings from './BlockedSettings';


export default class SettingsContent extends Component {
    content ="";
    pages = {
      account: AccountSettings,
      key: KeySettings,
      peer: PeerSettings,
      language: LanguageSettings,
      webtorrent: WebtorrentSettings,
      webrtc: WebRTCSettings,
      beta: BetaSettings,
      blocked: BlockedSettings,
    };

  constructor() {
    super();
    this.content = "home";
  }
  render() {
    const Content = this.pages[this.props.id] || this.pages.account;
    return (
      <Content />
    );
  }
}
