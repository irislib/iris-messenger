var codeReader;

function startPrivKeyQRScanner() {
  startQRScanner('privkey-qr-video', result => {
    var qr = JSON.parse(result.text);
    if (qr.priv !== undefined) {
      login(qr);
      return true;
    }
  });
}

function startChatLinkQRScanner() {
  startQRScanner('chatlink-qr-video', result => {
    $('#paste-chat-link').val(result.text);
    $('#paste-chat-link').trigger('input');
  });
}

function startQRScanner(videoElementId, callback) {
    codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromInputVideoDevice(undefined, videoElementId)
        .then(result => {
            if (callback(result)) {
              cleanupScanner();
            }
        }).catch(err => {
            if (err != undefined) {
                console.error(err)
            }
            if (codeReader != undefined && codeReader != null) {
                cleanupScanner()
            }
        });
}

function cleanupScanner() {
    if (codeReader != undefined || codeReader != null) {
        codeReader.reset();
        codeReader = null;
    }
}

export default {cleanupScanner, startQRScanner, startChatLinkQRScanner, startPrivKeyQRScanner};
