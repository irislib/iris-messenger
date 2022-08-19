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

  constructor() {
    super();
    this.content = "home";
  }
  render() {
    switch (this.props.id) {
      case "key":
        return (<KeySettings />);
      case "peer":
        return (<PeerSettings />);
      case "language":
        return (<LanguageSettings />);
      case "webtorrent":
        return (<WebtorrentSettings />);
      case "webrtc":
        return (<WebRTCSettings />);
      case "beta":
        return (<BetaSettings />);
      case "blocked":
        return (<BlockedSettings />);
      default:
        return (<AccountSettings />);
    }
  }
}
