import { BoltIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { useEffect, useState } from 'preact/hooks';

import Events from '../../../nostr/Events';
import SocialNetwork from '../../../nostr/SocialNetwork';
import { decodeInvoice, formatAmount } from '../../../utils/Lightning.ts';
import ZapModal from '../../modal/Zap';
import Key from "@/nostr/Key.ts";

const Zap = ({ event }) => {
  const [state, setState] = useState({
    totalZapAmount: 0,
    formattedZapAmount: '',
    zapped: false,
    showZapModal: false,
    lightning: undefined,
  });

  useEffect(() => {
    const unsubProfile = SocialNetwork.getProfile(event.pubkey, (profile) => {
      if (!profile) return;
      const lightning = profile.lud16 || profile.lud06;
      setState((prevState) => ({
        ...prevState,
        lightning,
      }));
    });

    const unsubZaps = Events.getZaps(event.id, handleZaps);

    return () => {
      unsubProfile();
      unsubZaps();
    };
  }, [event]);

  const handleZaps = debounce(
    (zaps) => {
      const zapEvents = Array.from(zaps?.values()).map((eventId) => Events.db.by('id', eventId));
      let totalZapAmount = 0;
      let zapped = false;
      zapEvents.forEach((event) => {
        const bolt11 = event?.tags.find((tag) => tag[0] === 'bolt11')[1];
        if (!bolt11) {
          console.log('Invalid zap, missing bolt11 tag');
          return;
        }
        if (Events.getZappingUser(event?.id, false) === Key.getPubKey()) {
          zapped = true;
        }
        const decoded = decodeInvoice(bolt11);
        const amount = (decoded?.amount || 0) / 1000;
        totalZapAmount += amount;
      });
      
      setState((prevState) => ({
        ...prevState,
        totalZapAmount,
        zapped,
        formattedZapAmount: (totalZapAmount && formatAmount(totalZapAmount)) || '',
      }));
    },
    1000,
    { leading: true },
  );

  return state.lightning ? (
    <>
      <a
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setState((prevState) => ({ ...prevState, showZapModal: true }));
        }}
        className={`btn-ghost btn-sm hover:bg-transparent btn content-center gap-2 rounded-none
          ${state.zapped ? 'text-iris-orange' : 'text-neutral-500 hover:text-iris-orange'}`}
      >
        <BoltIcon width={18} />
        {state.formattedZapAmount}
      </a>
      {state.showZapModal && (
        <ZapModal
          show={true}
          lnurl={state.lightning}
          note={event.id}
          recipient={event.pubkey}
          onClose={() => setState((prevState) => ({ ...prevState, showZapModal: false }))}
        />
      )}
    </>
  ) : null;
};

export default Zap;
