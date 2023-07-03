import { memo, useState } from 'react';
import { nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import { formatAmount } from '../../Lightning';
import Identicon from '../Identicon';
import Modal from '../modal/Modal';
import Name from '../Name';
import graphNetwork from '../../dwotr/GraphNetwork';

type ReactionData = {
  pubkey: string;
  text?: string;
};

const Reaction = memo(({ data }: { data: ReactionData }) => {
  const npub = data.pubkey.startsWith('npub') ? data.pubkey : nip19.npubEncode(data.pubkey);
  return (
    <Link href={`/${npub}`} className="flex items-center gap-4">
      <Identicon str={data.pubkey} width={40} />
      <div className="flex flex-col">
        <Name pub={data.pubkey} />
        {data.text && <small className="text-neutral-500">{data.text}</small>}
      </div>
    </Link>
  );
});

//formatAmount(amount / 1000)

const ReactionsList = (props) => {
  const { likes, reposts, zapAmountByUser, formattedZapAmount, wot, trustCount, distrustCount } = props;
  const [modalReactions, setModalReactions] = useState([] as ReactionData[]);
  const [modalTitle, setModalTitle] = useState('');
  const hasReactions = likes.length > 0 || reposts.length > 0 || zapAmountByUser?.size > 0;
  if (!hasReactions) return null;
  return (
    <>
      <hr className="-mx-2 opacity-10" />
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
        {likes.length > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                const data = likes.map((pubkey) => ({ pubkey }));
                setModalReactions(data);
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
                const data = reposts.map((pubkey) => ({ pubkey }));
                setModalReactions(data);
                setModalTitle('Reposted by');
              }}
              className="cursor-pointer hover:underline"
            >
              {reposts.length} <span className="text-neutral-500">Reposts</span>
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
        {trustCount > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                let list = graphNetwork.getTrustList(wot?.vertice, 1);
                const data = list.map(({outV, edge}) => ({ pubkey: outV.key, text: edge.note }));
                setModalReactions(data);
                setModalTitle('Trusted by');
              }}
              className="cursor-pointer hover:underline"
            >
              {trustCount} <span className="text-neutral-500">Trusts</span>
            </a>
          </div>
        )}
        {distrustCount > 0 && (
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                let list = graphNetwork.getTrustList(wot?.vertice, -1);
                const data = list.map(({outV, edge}) => ({ pubkey: outV.key, text: edge.note }));
                setModalReactions(data);
                setModalTitle('Distrusted by');
              }}
              className="cursor-pointer hover:underline"
            >
              {distrustCount} <span className="text-neutral-500">Distrusts</span>
            </a>
          </div>
        )}
      </div>
      <hr className="-mx-2 opacity-10 mb-2" />
    </>
  );
};

export default ReactionsList;
