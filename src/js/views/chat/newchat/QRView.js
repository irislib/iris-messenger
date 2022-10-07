import { translate as t } from '../../../translations/Translation';
import QRScanner from '../../../QRScanner';
import Button from '../../../components/basic/Button';
import $ from 'jquery';
import Component from '../../../BaseComponent';
import QRCode from '../../../lib/qrcode.min';
import Helpers from '../../../Helpers';
import iris from 'iris-lib';

function setChatLinkQrCode(link) {
    let qrCodeEl = $('#my-qr-code');
    if (qrCodeEl.length === 0) { return; }
    qrCodeEl.empty();
    new QRCode(qrCodeEl[0], {
      text: link || iris.session.getMyChatLink(),
      width: 320,
      height: 320,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
  
  class QRView extends Component {

    componentDidMount() {
        setChatLinkQrCode(this.props.url);
      }

    scanChatLinkQr() {
        if ($('#chatlink-qr-video:visible').length) {
          $('#chatlink-qr-video').hide();
          QRScanner.cleanupScanner();
        } else {
          $('#chatlink-qr-video').show();
          QRScanner.startChatLinkQRScanner(result => result.text && Helpers.followChatLink(result.text));
        }
      }

    render(){
        return(
            <>
            <h2>{t('Show_or_scan_QR_code')}</h2>
            <Button id="scan-chatlink-qr-btn" onClick={() => this.scanChatLinkQr()}>{t('scan_qr_code')}</Button>
            <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;" />
            <h3>{t('your_qr_code')}</h3>
            <p id="my-qr-code" class="qr-container" />
            </>
        );
    }
  }
  export default QRView;