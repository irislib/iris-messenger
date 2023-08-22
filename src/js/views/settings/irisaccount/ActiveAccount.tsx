import Key from '@/nostr/Key.ts';
import SocialNetwork from '@/nostr/SocialNetwork.ts';
import AccountName from '@/views/settings/irisaccount/AccountName.tsx';

export default function ActiveAccount({ name, setAsPrimary }) {
  const onClick = () => {
    const newNip = name + '@iris.to';
    const timeout = setTimeout(() => {
      SocialNetwork.setMetadata({ nip05: newNip });
    }, 2000);
    SocialNetwork.getProfile(Key.getPubKey(), (p) => {
      if (p) {
        clearTimeout(timeout);
        if (p.nip05 !== newNip) {
          p.nip05 = newNip;
          SocialNetwork.setMetadata(p);
          setAsPrimary();
        }
      }
    });
  };

  return (
    <div>
      <div className="negative">
        You have an active iris.to account:
        <AccountName name={name} />
      </div>
      <p>
        <button className="btn btn-sm btn-primary" onClick={onClick}>
          Set as primary Nostr address (nip05)
        </button>
      </p>
    </div>
  );
}
