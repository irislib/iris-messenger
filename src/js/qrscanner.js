window.addEventListener('load', function () {
    let selectedDeviceId;
    const codeReader = new ZXing.BrowserMultiFormatReader()
    console.log('ZXing code reader initialized')
    codeReader.getVideoInputDevices()
        .then((videoInputDevices) => {
            selectedDeviceId = videoInputDevices[0].deviceId
            document.getElementById('startButton').addEventListener('click', () => {
                codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
                    if (result) {
                        console.log(result)
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
                console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
            })
        })
        .catch((err) => {
            console.error(err)
        })
})