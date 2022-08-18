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
    let page = this.props.id;

    if(page == "AccountSettings"){
      return (<AccountSettings />);
    }else if(page == "KeySettings"){
      return (<KeySettings />);
    }else if(page == "PeerSettings"){
      return (<PeerSettings />);
    }else if(page == "LanguageSettings"){
      return (<LanguageSettings />);
    }else if(page == "WebtorrentSettings"){
      return (<WebtorrentSettings />);
    }else if(page == "WebRTCSettings"){
      return (<WebRTCSettings />);
    }else if(page == "BetaSettings"){
      return (<BetaSettings />);
    }else if(page == "BlockedSettings"){
      return (<BlockedSettings />);
    }
      return (<AccountSettings />);
    
  }
}
