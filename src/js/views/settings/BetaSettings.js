import { html } from 'htm/preact';
import Helpers from '../../Helpers';
import _ from 'lodash';
import State from '../../State';
import Session from '../../Session';
import Component from '../../BaseComponent';
import {translate as t} from '../../Translation';
import {setRTCConfig, getRTCConfig, DEFAULT_RTC_CONFIG} from '../../components/VideoCall';
import Notifications from '../../Notifications';
import $ from 'jquery';

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
        <p><input type="checkbox" checked={this.state.local.showBetaFeatures} onChange={() => State.local.get('settings').get('showBetaFeatures').put(!this.state.local.showBetaFeatures)} id="showBetaFeatures"/><label for="showBetaFeatures">{t('show_beta_features')}</label></p>
        </div>
        </>
    );
  }
  componentDidMount() {
    const blockedUsers = {};

    $('#rtc-config').val(JSON.stringify(getRTCConfig()));

    State.electron && State.electron.get('settings').on(this.inject('electron', 'electron'));
    State.local.get('settings').on(this.sub(local => {
      console.log('local settings', local);
      if (local) {
        this.setState({local});
      }
    }));
    State.public.user().get('webPushSubscriptions').map().on(this.sub(
      () => this.setState({webPushSubscriptions: Notifications.webPushSubscriptions})
    ));
    State.public.user().get('block').map().on(this.sub(
      (v,k) => {
        blockedUsers[k] = v;
        this.setState({blockedUsers});
      }
    ));
  }
}