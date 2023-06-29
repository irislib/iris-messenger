import { memo, useState } from 'react';
import { Event, nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import { decodeInvoice, formatAmount } from '../../Lightning';
import Events from '../../nostr/Events';
import Identicon from '../Identicon';
import Modal from '../modal/Modal';
import Name from '../Name';

const Reaction = memo(
  ({ event }: { event: Event }) => {
    const reactor = (event.kind === 9735 ? Events.getZappingUser(event.id) : event.pubkey) || '';
    const invoice =
      event.kind === 9735 ? event.tags?.find((tag) => tag[0] === 'bolt11')?.[1] : undefined;
    const amount = invoice ? decodeInvoice(invoice)?.amount : undefined;
    console.log('amount', amount, 'invoice', invoice, 'event', event);
    return (
      <Link
        href={`/${nip19.npubEncode(reactor)}`}
        key={event.id}
        className="flex items-center gap-4"
      >
        <Identicon str={reactor} width={40} />
        <div className="flex flex-col">
          <Name pub={reactor} />
          {amount && <small className="text-neutral-500">{formatAmount(amount / 1000)}</small>}
        </div>
      </Link>
    );
  },
  (prevProps, nextProps) => prevProps.event.id === nextProps.event.id,
);

const ReactionsList = (props) => {
  const { likes, reposts, zaps, totalZapAmount, formattedZapAmount } = props;
  const [modalReactions, setModalReactions] = useState([] as Event[]);
  const [modalTitle, setModalTitle] = useState('');
  console.log(333, likes.length, reposts.length, zaps.length, totalZapAmount, formattedZapAmount);
  return (
    <>
      <hr className="-mx-4 opacity-10" />
      {modalReactions.length > 0 && (
        <Modal showContainer={true} onClose={() => setModalReactions([])}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-scroll max-h-[50vh] w-96">
            {modalReactions.map((event) => (
              <Reaction key={event.id} event={event} />
            ))}
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-4 py-2">
        {likes.length > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                setModalReactions(likes);
                setModalTitle('Liked by');
              }}
              className="cursor-pointer hover:underline"
            >
              {likes.length} <span className="text-neutral-500">Likes</span>
            </a>
          </div>
        )}
        {reposts.length > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                setModalReactions(reposts);
                setModalTitle('Reposted by');
              }}
              className="cursor-pointer hover:underline"
            >
              {reposts.length} <span className="text-neutral-500">Reposts</span>
            </a>
          </div>
        )}
        {zaps.length > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                setModalReactions(zaps);
                setModalTitle('Zapped by');
              }}
              className="cursor-pointer hover:underline"
            >
              {zaps.length} <span className="text-neutral-500">Zaps</span>
              {totalZapAmount > 0 && (
                <small className="text-neutral-500"> ({formattedZapAmount})</small>
              )}
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default ReactionsList;
