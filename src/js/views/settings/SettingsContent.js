import Component from '../../BaseComponent';

import AccountSettings from './AccountSettings';
import AppearanceSettings from './AppearanceSettings';
import BetaSettings from './BetaSettings';
import BlockedSettings from './BlockedSettings';
import IrisAccountSettings from './IrisAccountSettings';
import LanguageSettings from './LanguageSettings';
import MediaSettings from './MediaSettings';
import NetworkSettings from './NetworkSettings';

export default class SettingsContent extends Component {
  content = '';
  pages = {
    account: AccountSettings,
    network: NetworkSettings,
    appearance: AppearanceSettings,
    language: LanguageSettings,
    media: MediaSettings,
    beta: BetaSettings,
    blocked_users: BlockedSettings,
    iris_account: IrisAccountSettings,
  };

  constructor() {
    super();
    this.content = 'home';
  }
  render() {
    const Content = this.pages[this.props.id] || this.pages.account;
    return <Content />;
  }
}
