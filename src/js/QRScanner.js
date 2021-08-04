var codeReader;

function startPrivKeyQRScanner() {
  return new Promise(resolve => {
    startQRScanner('privkey-qr-video', result => {
      var qr = JSON.parse(result.text);
      if (qr.priv !== undefined) {
        resolve(qr);
        return true;
      }
    });
  });
}

function startChatLinkQRScanner(callback) {
  startQRScanner('chatlink-qr-video', callback);
}

async function startQRScanner(videoElementId, callback) {
    const { BrowserQRCodeReader } = await import('@zxing/library');
    codeReader = new BrowserQRCodeReader();
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
