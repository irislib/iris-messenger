import Component from '../../BaseComponent';
import {translate as t} from '../../translations/Translation';
import {setRTCConfig, getRTCConfig, DEFAULT_RTC_CONFIG} from '../../components/VideoCall';
import $ from 'jquery';
import Button from '../../components/basic/Button';
import iris from 'iris-lib';

export default class WebRTCSettings extends Component {

  render() {
    return (
        <>
          <div class="centered-container">
            <h3>{t('webrtc_connection_options')}</h3>
            <p><small>{t('webrtc_info')}</small></p>
            <p><textarea rows="4" id="rtc-config" placeholder={t('webrtc_connection_options')} onChange={e => this.rtcConfigChanged(e)} /></p>
            <Button onClick={() => this.restoreDefaultRtcConfig()}>{t('restore_defaults')}</Button>
          </div>
        </>
    );
  }

  componentDidMount() {
    const blockedUsers = {};

    $('#rtc-config').val(JSON.stringify(getRTCConfig()));

    iris.electron && iris.electron.get('settings').on(this.inject('electron', 'electron'));
    iris.local().get('settings').on(this.sub(local => {
      console.log('local settings', local);
      if (local) {
        this.setState({local});
      }
    }));
    iris.user().get('webPushSubscriptions').map().on(this.sub(
      () => this.setState({webPushSubscriptions: iris.notifications.webPushSubscriptions})
    ));
    iris.user().get('block').map().on(this.sub(
      (v,k) => {
        blockedUsers[k] = v;
        this.setState({blockedUsers});
      }
    ));
  }

  rtcConfigChanged(e) {
    setRTCConfig(JSON.parse(e.target.value));
  }

  restoreDefaultRtcConfig() {
    setRTCConfig(DEFAULT_RTC_CONFIG);
    $('#rtc-config').val(JSON.stringify(getRTCConfig()));
  }
}