import { XMarkIcon } from '@heroicons/react/24/solid';

import Copy from '@/components/buttons/Copy.tsx';
import QRModal from '@/components/modal/QRModal.tsx';
import Key from '@/nostr/Key.ts';
import { translate as t } from '@/translations/Translation.mjs';
import Helpers from '@/utils/Helpers.tsx';

export default function NoFollowers({ setNoFollowers, setShowQrModal, showQrModal }) {
  return (
    <div className="flex flex-col flex-1 relative">
      <div className="absolute top-0 right-0 cursor-pointer" onClick={() => setNoFollowers(false)}>
        <XMarkIcon width={24} />
      </div>
      <p>{t('no_followers_yet')}</p>
      <div className="flex gap-2 my-2">
        <Copy
          className="btn btn-sm btn-neutral"
          text={t('copy_link')}
          copyStr={Helpers.getMyProfileLink()}
        />
        <button className="btn btn-sm btn-neutral" onClick={() => setShowQrModal(true)}>
          {t('show_qr_code')}
        </button>
      </div>
      <small>{t('no_followers_yet_info')}</small>
      {showQrModal && <QRModal onClose={() => setShowQrModal(false)} pub={Key.getPubKey()} />}
    </div>
  );
}
