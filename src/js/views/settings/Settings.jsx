import { Component, html } from 'htm/preact';
import Session from '../../Session';
import _ from 'lodash';
import SettingsMenu from './SettingsMenu';
import SettingsContent from './SettingsContent';
import Header from '../../components/Header';

class Settings extends Component {
  

  constructor() {
    super();
    this.state = Session.DEFAULT_SETTINGS;
  }

  render() {
    let page = html`<${SettingsContent} id=${this.props.page}/>`;
    return (
      <>
      <Header />
      <div class="main-view" id="settings">
        <SettingsMenu key="moi" />
        {page}    
      </div>
      </>
    );
  }
}

export default Settings;