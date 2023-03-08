import {createRef} from "preact";
import {useEffect} from "preact/hooks";
import {html} from "htm/preact";
import QRCode from '../lib/qrcode.min';

export default function Qr(props) {
  const ref = createRef();
  //const [qr, setQr] = useState(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    new QRCode(ref.current, {
      text: props.data,
      width: props.width || 300,
      height: props.width || 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }, [props.data]);

  return html`<div ref=${ref} />`;
};