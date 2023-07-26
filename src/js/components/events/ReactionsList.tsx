import { memo, useEffect, useState } from 'react';
import { nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import { decodeInvoice, formatAmount } from '../../Lightning';
import Events from '../../nostr/Events'; // Import Events module
import Modal from '../modal/Modal';
import Avatar from '../user/Avatar';
import Name from '../user/Name';

type ReactionData = {
  pubkey: string;
  text?: string;
};

const Reaction = memo(({ data }: { data: ReactionData }) => {
  const npub = data.pubkey.startsWith('npub') ? data.pubkey : nip19.npubEncode(data.pubkey);
  return (
    <Link href={`/${npub}`} className="flex items-center gap-4">
      <Avatar str={data.pubkey} width={40} />
      <div className="flex flex-col">
        <Name pub={data.pubkey} />
        {data.text && <small className="text-neutral-500">{data.text}</small>}
      </div>
    </Link>
  );
});

const ReactionsList = ({ event }) => {
  const [likes, setLikes] = useState(new Set());
  const [reposts, setReposts] = useState(new Set());
  const [zapAmountByUser, setZapAmountByUser] = useState(new Map());
  const [formattedZapAmount, setFormattedZapAmount] = useState('');
  const [modalReactions, setModalReactions] = useState([] as ReactionData[]);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    const unsubFuncs = [] as any[]; // To store unsubscribe functions

    const handleLikes = (likedBy) => {
      setLikes(new Set(likedBy));
    };

    const handleReposts = (repostedBy) => {
      setReposts(new Set(repostedBy));
    };

    const handleZaps = (zaps) => {
      const zapData = new Map<string, number>();
      let totalZapAmount = 0;
      const zapEvents = Array.from(zaps?.values()).map((eventId) => Events.db.by('id', eventId));
      zapEvents.forEach((zapEvent) => {
        const bolt11 = zapEvent?.tags.find((tag) => tag[0] === 'bolt11')[1];
        if (!bolt11) {
          console.log('Invalid zap, missing bolt11 tag');
          return;
        }
        const decoded = decodeInvoice(bolt11);
        const amount = (decoded?.amount || 0) / 1000;
        totalZapAmount += amount;
        const zapper = Events.getZappingUser(zapEvent.id);
        if (zapper) {
          const existing = zapData.get(zapper) || 0;
          zapData.set(zapper, existing + amount);
        }
      });

      setZapAmountByUser(zapData);
      setFormattedZapAmount(totalZapAmount > 0 ? formatAmount(totalZapAmount) : '');
    };

    // Subscribe to each event and store unsubscribe function
    unsubFuncs.push(Events.getLikes(event.id, handleLikes));
    unsubFuncs.push(Events.getReposts(event.id, handleReposts));
    unsubFuncs.push(Events.getZaps(event.id, handleZaps));

    // Return cleanup function
    return () => {
      unsubFuncs.forEach((unsub) => unsub());
    };
  }, [event]);

  const hasReactions = likes.size > 0 || reposts.size > 0 || zapAmountByUser.size > 0;
  if (!hasReactions) return null;

  return (
    <>
      <hr className="-mx-2 opacity-10 mt-2" />
      {modalReactions.length > 0 && (
        <Modal showContainer={true} onClose={() => setModalReactions([])}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-scroll max-h-[50vh] w-96">
            {modalReactions.map((data) => (
              <Reaction key={data.pubkey} data={data} />
            ))}
          </div>
        </Modal>
      )}
      <div className="flex items-center gap-4 py-2">
        {likes.size > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                const data = Array.from(likes).map((pubkey) => ({ pubkey })) as ReactionData[];
                setModalReactions(data);
                setModalTitle('Liked by');
              }}
              className="cursor-pointer hover:underline"
            >
              {likes.size} <span className="text-neutral-500">Likes</span>
            </a>
          </div>
        )}
        {reposts.size > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                const data = Array.from(reposts).map((pubkey) => ({ pubkey })) as ReactionData[];
                setModalReactions(data);
                setModalTitle('Reposted by');
              }}
              className="cursor-pointer hover:underline"
            >
              {reposts.size} <span className="text-neutral-500">Reposts</span>
            </a>
          </div>
        )}
        {zapAmountByUser?.size > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                const data: ReactionData[] = [];
                const sortedArray = [...zapAmountByUser.entries()].sort((a, b) => b[1] - a[1]);
                for (const [pubkey, amount] of sortedArray) {
                  data.push({ pubkey, text: formatAmount(amount) });
                }
                setModalReactions(data);
                setModalTitle('Zapped by');
              }}
              className="cursor-pointer hover:underline"
            >
              {zapAmountByUser.size} <span className="text-neutral-500">Zaps</span>
              {formattedZapAmount && (
                <small className="text-neutral-500"> ({formattedZapAmount})</small>
              )}
            </a>
          </div>
        )}
      </div>
      <hr className="-mx-2 opacity-10 mb-2" />
    </>
  );
};

export default ReactionsList;
