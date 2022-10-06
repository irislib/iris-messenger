import Session from 'iris-lib/src/session';
import Component from '../../BaseComponent';
import {translate as t} from '../../translations/Translation';
import iris from 'iris-lib';

export default class BetaSettings extends Component {
  constructor() {
    super();
    this.state = Session.DEFAULT_SETTINGS;
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = "settings";
  }

  render() {
    return (
        <>
        <div class="centered-container">
        <h3>Show beta features</h3>
        <p><input type="checkbox" checked={this.state.local.showBetaFeatures} onChange={() => iris.local().get('settings').get('showBetaFeatures').put(!this.state.local.showBetaFeatures)} id="showBetaFeatures" /><label for="showBetaFeatures">{t('show_beta_features')}</label></p>
        </div>
        </>
    );
  }
  componentDidMount() {
    iris.electron && iris.electron.get('settings').on(this.inject('electron', 'electron'));
    iris.local().get('settings').on(this.sub(local => {
      console.log('local settings', local);
      if (local) {
        this.setState({local});
      }
    }));
  }
}
