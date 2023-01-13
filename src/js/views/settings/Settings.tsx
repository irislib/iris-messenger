import { Component } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { route } from 'preact-router';

import Header from '../../components/Header';
import Icons from '../../Icons';

import SettingsContent from './SettingsContent';
import SettingsMenu from './SettingsMenu';

type Props = { page?: string };

type State = {
  toggleSettingsMenu: boolean;
  showSettingsMenu: boolean;
  platform: string;
};

class Settings extends Component<Props, State> {
  componentDidMount() {
    iris
      .local()
      .get('toggleSettingsMenu')
      .on((show: boolean) => this.toggleMenu(show));
  }
  toggleMenu(show: boolean): void {
    this.setState({
      showSettingsMenu: typeof show === 'undefined' ? !this.state.toggleSettingsMenu : show,
    });
  }

  render() {
    // ? const isDesktopNonMac = this.state.platform && this.state.platform !== 'darwin'

    return (
      <>
        <Header />
        <div class="main-view" id="settings">
          <div style="flex-direction: row;" id="settings">
            <div class="logo" className={this.props.page ? 'visible-xs-flex' : 'hidden'}>
              <div
                href="#/settings/"
                onClick={(e) => this.onLogoClick(e)}
                style="margin: 1em; display:flex;"
              >
                <div>{Icons.backArrow}</div>
              </div>
            </div>
            <SettingsMenu activePage={this.props.page} />
            <div className={this.props.page ? '' : 'hidden-xs'} style="padding: 0px 15px;">
              <SettingsContent id={this.props.page} />
            </div>
          </div>
        </div>
      </>
    );
  }

  onLogoClick(e) {
    console.log('test open' + ($(window).width() > 625));
    e.preventDefault();
    e.stopPropagation();
    $('a.logo').blur();
    $(window).width() > 625;
    iris.local().get('toggleSettingsMenu').put(true);
    route('/settings/');
  }
}
export default Settings;
