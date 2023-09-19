import ProxyImg from '@/components/ProxyImg.tsx';
import Avatar from '@/components/user/Avatar.tsx';
import Name from '@/components/user/Name.tsx';
import Key from '@/nostr/Key.ts';
import { translate as t } from '@/translations/Translation.mjs';

export default function SearchResult({ item, onClick, onFocus, selected }) {
  let followText = '';
  if (item.followers) {
    if (item.followDistance === 0) {
      followText = t('you');
    } else if (item.followDistance === 1) {
      followText = t('following');
    } else {
      followText = `${item.followers.size} ${t('followers')}`;
    }
  }
  const npub = Key.toNostrBech32Address(item.key, 'npub') || '';
  return (
    <a
      onFocus={onFocus}
      tabIndex={2}
      className={
        'p-2 cursor-pointer flex gap-2 items-center result ' +
        (selected ? 'selected bg-neutral-700' : '')
      }
      href={`/${npub}`}
      onClick={(e) => onClick(e, item)}
    >
      {item.picture ? (
        <ProxyImg src={item.picture} className="rounded-full" width={40} />
      ) : (
        <Avatar key={`${npub}ic`} str={npub} width={40} />
      )}
      <div>
        <Name pub={item.key} key={item.key + 'searchResult'} />
        <br />
        <small>{followText}</small>
      </div>
    </a>
  );
}
