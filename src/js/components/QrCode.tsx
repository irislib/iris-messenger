import { createRef } from 'preact';
import { useEffect } from 'preact/hooks';

export default function Qr(props) {
  const ref = createRef();
  //const [qr, setQr] = useState(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    import('../lib/qrcode.min').then((module) => {
      const QRCode = module.default;
      new QRCode(ref.current, {
        text: props.data,
        width: props.width || 300,
        height: props.width || 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
    });
  }, [props.data]);

  return <div style="border: 5px solid white; display: inline-block;" ref={ref} />;
}
