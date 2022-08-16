import { html } from 'htm/preact';
import _ from 'lodash';
import Component from '../../BaseComponent';
import {ExistingAccountLogin} from '../Login';
import {translate as t} from '../../Translation';
import {Router, Route, Routes } from "react-router-dom";

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
    //this.id = "settingslist";
  }
  render() {
    //content = <AccountSettings/>;
    let page = this.props.id;

    if(page == "AccountSettings"){
      return (<AccountSettings/>);
    }else if(page == "KeySettings"){
      return (<KeySettings/>);
    }else if(page == "PeerSettings"){
      return (<PeerSettings/>);
    }else if(page == "LanguageSettings"){
      return (<LanguageSettings/>);
    }else if(page == "WebtorretSettings"){
      return (<WebtorretSettings/>);
    }else if(page == "WebRTCSettings"){
      return (<WebRTCSettings/>);
    }else if(page == "BetaSettings"){
      return (<BetaSettings/>);
    }else if(page == "BlockedSettings"){
      return (<BlockedSettings/>);
    }else{
      return (<AccountSettings/>);
    }
 
    return (<AccountSettings/>);
    /*return (
        <>
        {content}
        </>
    );*/
  }
}