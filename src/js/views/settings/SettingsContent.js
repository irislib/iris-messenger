import Component from '../../BaseComponent';
import { html } from 'htm/preact';

import AccountSettings from './AccountSettings';
import KeySettings from './KeySettings';
import PeerSettings from './PeerSettings';
import LanguageSettings from './LanguageSettings';
import WebtorretSettings from './WebtorretSettings';
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
      return (html`<${LanguageSettings} key="moi" />`);
    }else if(page == "WebtorretSettings"){
      return (<WebtorretSettings />);
    }else if(page == "WebRTCSettings"){
      return (<WebRTCSettings />);
    }else if(page == "BetaSettings"){
      return (<BetaSettings />);
    }else if(page == "BlockedSettings"){
      return (<BlockedSettings />);
    }else{
      return (<AccountSettings />);
    }
  }
}
