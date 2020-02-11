window.addEventListener('load', function () {
    let selectedDeviceId;
    const codeReader = new ZXing.BrowserMultiFormatReader()
    codeReader.getVideoInputDevices()
        .then((videoInputDevices) => {
            document.getElementById('startButton').addEventListener('click', () => {
                codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
                    if (result) {
                        var privkey = document.getElementById('paste-privkey')
                        privkey.value = result.text

                        var event = new Event('input', {
                            bubbles: true,
                            cancelable: true,
                        });

                        privkey.dispatchEvent(event);
                    }
                    if (err && !(err instanceof ZXing.NotFoundException)) {
                        console.error(err)
                    }
                })
            })
        })
        .catch((err) => {
            console.error(err)
        })
})
