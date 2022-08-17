import { Component, html } from 'htm/preact';
import _ from 'lodash';
import SettingsMenu from './SettingsMenu';
import SettingsContent from './SettingsContent';
import Header from '../../components/Header';
import Icons from '../../Icons';
import State from "../../State";
import $ from 'jquery';
import { route } from 'preact-router';

type Props = { page?: string;};

type State = {
  toggleSettingsMenu: boolean;
  showSettingsMenu: boolean;
  platform: string;
}

class Settings extends Component<Props,State> {
  
  
  componentDidMount() {
    State.local.get('toggleSettingsMenu').on((show: boolean) => this.toggleMenu(show));
  }
  toggleMenu(show: boolean): void {
    this.setState({showSettingsMenu: typeof show === 'undefined' ? !this.state.toggleSettingsMenu : show});
  }

  render() {
    let page = null;
    const isDesktopNonMac = this.state.platform && this.state.platform !== 'darwin';

    console.log("page: " + this.props.page);
    let mainpage = (this.props.page == 'undefined' || this.props.page == null || this.props.page == '');
    
    if(mainpage){
      page = html`<${SettingsMenu} />`;
    }else if(!($(window).width() > 625)){
      page = html`<div style="padding: 0px 15px;"> <${SettingsContent} id=${this.props.page} /> </div>`;
    }else{
      page = html`<${SettingsMenu} /> <div style="padding: 0px 15px;"> <${SettingsContent} id=${this.props.page} /> </div>`;
    }
    
    
    
    console.log("Visible: " + this.state.showSettingsMenu);

    return (
      <>
      <Header />
      <div style="flex-direction: row;" id="settings">
        <div class='logo' style={(mainpage || ($(window).width() > 625)) ? 'display: none !important;' : 'display: flex;' }>
          <div href="/settings/" onClick={e => this.onLogoClick(e) } style="margin: 1em; display:flex;" >
            <div>{Icons.backArrow}</div>
          </div>
        </div>
          {page}  
      </div>
      </>
    );
  }
  
  onLogoClick(e) {
    console.log("test open" + ($(window).width() > 625));
    e.preventDefault();
    e.stopPropagation();
    $('a.logo').blur();
    ($(window).width() > 625);
    State.local.get('toggleSettingsMenu').put(true);
    route('/settings/')
  }
}
export default Settings;