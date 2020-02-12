var codeReader;

function startQRScanner() {
    codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromInputVideoDevice(undefined, 'video')
        .then(result => {
            var qr = JSON.parse(result.text);
            if (qr.priv != undefined) {
                cleanupScanner()
                login(qr);
            }
        }).catch(err => {
            if (err != undefined) {
                console.error(err)
            }
            if (codeReader != undefined) {
                cleanupScanner()
            }
        });
}

function cleanupScanner() {
    if (codeReader != undefined) {
        codeReader.reset();
    }
}
