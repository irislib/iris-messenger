window.addEventListener('load', function () {
    let selectedDeviceId;
    let recording = false;
    const codeReader = new ZXing.BrowserMultiFormatReader()
    codeReader.getVideoInputDevices()
        .then((videoInputDevices) => {
            document.getElementById('startButton').addEventListener('click', () => {
                if (recording) {
                  codeReader.reset();
                  recording = false;
                  return;
                }
                recording = true;
                codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
                    if (result) {
                        var privkey = document.getElementById('paste-privkey')
                        privkey.value = result.text

                        var event = new Event('input', {
                            bubbles: true,
                            cancelable: true,
                        });

                        privkey.dispatchEvent(event);
                        codeReader.reset();
                        recording = false;
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
