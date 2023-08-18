import { BoltIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';
import { useEffect, useState } from 'preact/hooks';

import Show from '@/components/helpers/Show.tsx';
import { useLocalState } from '@/LocalState.ts';
import EventDB from '@/nostr/EventDB.ts';
import Key from '@/nostr/Key.ts';
import { getZappingUser } from '@/nostr/utils.ts';
import Icons from '@/utils/Icons.tsx';

import Events from '../../../nostr/Events';
import SocialNetwork from '../../../nostr/SocialNetwork';
import { decodeInvoice, formatAmount } from '../../../utils/Lightning.ts';
import ZapModal from '../../modal/Zap';

const Zap = ({ event }) => {
  const [state, setState] = useState({
    totalZapAmount: 0,
    formattedZapAmount: '',
    zapped: false,
    showZapModal: false,
    lightning: undefined,
    defaultZapAmount: 0,
  });

  const [defaultZapAmount] = useLocalState('defaultZapAmount', 0);
  const [longPress, setLongPress] = useState(false); // state to determine if it's a long press

  let pressTimer: any = null;

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.showZapModal) {
      setState((prevState) => ({ ...prevState, showZapModal: true }));
    }
  };

  const onMouseDown = (e) => {
    pressTimer = setTimeout(() => {
      setLongPress(true);
      handleButtonClick(e); // Open the modal after 500ms of mouseDown
    }, 500);
  };

  const onMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer);
    if (!longPress) {
      handleButtonClick(e); // Open the modal on short press
    }
    setLongPress(false); // Reset the longPress state after handling
  };

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
      const zapEvents = Array.from(zaps?.values()).map((eventId) => EventDB.get(eventId));
      let totalZapAmount = 0;
      let zapped = false;
      zapEvents.forEach((event) => {
        const bolt11 = event?.tags.find((tag) => tag[0] === 'bolt11')?.[1];
        if (!bolt11) {
          console.log('Invalid zap, missing bolt11 tag');
          return;
        }
        if (event && getZappingUser(event, false) === Key.getPubKey()) {
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
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className={`btn-ghost btn-sm hover:bg-transparent btn content-center gap-2 rounded-none
          ${state.zapped ? 'text-iris-orange' : 'text-neutral-500 hover:text-iris-orange'}`}
      >
        <Show when={defaultZapAmount}>{Icons.quickZap}</Show>
        <Show when={!defaultZapAmount}>
          <BoltIcon width={18} />
        </Show>
        {state.formattedZapAmount}
      </a>
      {state.showZapModal && (
        <ZapModal
          quickZap={!!defaultZapAmount && !longPress}
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
