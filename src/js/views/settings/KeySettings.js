import iris from 'iris-lib';
import $ from 'jquery';

import Component from '../../BaseComponent';
import Button from '../../components/basic/Button';
import CopyButton from '../../components/CopyButton';
import Helpers from '../../Helpers';
import QRCode from '../../lib/qrcode.min';
import { translate as t } from '../../translations/Translation';

export default class KeySettings extends Component {
  constructor() {
    super();
    this.state = iris.session.DEFAULT_SETTINGS;
  }

  mailtoSubmit(e) {
    e.preventDefault();
    if (this.state.email && this.state.email === this.state.retypeEmail) {
      window.location.href = `mailto:${
        this.state.email
      }?&subject=Iris%20private%20key&body=${JSON.stringify(iris.session.getKey())}`;
    }
  }

  render() {
    return (
      <>
        <div class="centered-container">
          <h3>{t('private_key')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('private_key_warning') }} />
          <p>
            <Button onClick={() => downloadKey()}>{t('download_private_key')}</Button>
            <CopyButton
              notShareable={true}
              text={t('copy_private_key')}
              copyStr={JSON.stringify(iris.session.getKey())}
            />
          </p>
          <p>
            <Button onClick={(e) => togglePrivateKeyQR(e)}>{t('show_privkey_qr')}</Button>
          </p>
          <div id="private-key-qr" class="qr-container" />
          <hr />
          <p>{t('email_privkey_to_yourself')}:</p>
          <p>
            <form onSubmit={(e) => this.mailtoSubmit(e)}>
              <input
                name="email"
                type="email"
                onChange={(e) => this.setState({ email: e.target.value.trim() })}
                placeholder={t('email')}
              />
              <input
                name="verify_email"
                type="email"
                onChange={(e) => this.setState({ retypeEmail: e.target.value.trim() })}
                placeholder={t('retype_email')}
              />
              <Button type="submit">{t('send_email')}</Button>
            </form>
          </p>
          <hr />
          <p>
            <small
              dangerouslySetInnerHTML={{
                __html: t('privkey_storage_recommendation'),
              }}
            />
          </p>
        </div>
      </>
    );
  }
}

function downloadKey() {
  const key = iris.session.getKey();
  delete key['#'];
  return Helpers.download('iris_private_key.txt', JSON.stringify(key), 'text/plain', 'utf-8');
}

function togglePrivateKeyQR(e) {
  let btn = $(e.target);
  let show = $('#private-key-qr img').length === 0;
  let SHOW_TEXT = t('show_privkey_qr');
  let hidePrivateKeyInterval;
  function reset() {
    clearInterval(hidePrivateKeyInterval);
    $('#private-key-qr').empty();
    btn.text(SHOW_TEXT);
  }
  function hideText(s) {
    return `${t('hide_privkey_qr')} (${s})`;
  }
  if (show) {
    let showPrivateKeySecondsRemaining = 20;
    btn.text(hideText(showPrivateKeySecondsRemaining));
    hidePrivateKeyInterval = setInterval(() => {
      if ($('#private-key-qr img').length === 0) {
        clearInterval(hidePrivateKeyInterval);
        return;
      }
      showPrivateKeySecondsRemaining -= 1;
      if (showPrivateKeySecondsRemaining === 0) {
        reset();
      } else {
        btn.text(hideText(showPrivateKeySecondsRemaining));
      }
    }, 1000);
    let qrCodeEl = $('#private-key-qr');
    new QRCode(qrCodeEl[0], {
      text: JSON.stringify(iris.session.getKey()),
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  } else {
    reset();
  }
}
