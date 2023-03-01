import Component from '../../BaseComponent';

import Account from './Account';
import Appearance from './Appearance';
import Backup from './Backup';
import IrisAccount from './IrisAccount';
import Language from './Language';
import Media from './Media';
import Network from './Network';
import SocialNetwork from './SocialNetwork';

export default class SettingsContent extends Component {
  content = '';
  pages = {
    account: Account,
    network: Network,
    appearance: Appearance,
    language: Language,
    media: Media,
    backup: Backup,
    social_network: SocialNetwork,
    iris_account: IrisAccount,
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
