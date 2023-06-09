import Key from '../../nostr/Key';
import Name from '../Name';
import QrCode from '../QrCode';

import Modal from './Modal';

const QRModal = (props) => {
  const link = `https://iris.to/${Key.toNostrBech32Address(props.pub, 'npub')}`;
  return (
    <Modal centerVertically={true} showContainer={true} onClose={props.onClose}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <QrCode data={link} />
        <p>
          <Name pub={props.pub} />
        </p>
      </div>
    </Modal>
  );
};

export default QRModal;
