import { Event, UnsignedEvent } from 'nostr-tools';

import Events from '@/nostr/Events.ts';
import Key from '@/nostr/Key.ts';
import localState from '@/state/LocalState.ts';
import AccountName from '@/views/settings/irisaccount/AccountName.tsx';

export default function ReservedAccount({ name }) {
  const enableReserved = async () => {
    const pubkey = Key.getPubKey();
    const event: any = {
      content: `iris.to/${name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Events.getEventHash(event);
    event.sig = await Key.sign(event);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/confirm_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    localState.get('showNoIrisToAddress').put(false);
    localState.get('existingIrisToAddress').put({ confirmed: true, name });
    if (res.status === 200) {
      this.setState({
        error: null,
        existing: { confirmed: true, name: name },
      });
    } else {
      res
        .json()
        .then((json) => {
          this.setState({ error: json.message || 'error' });
        })
        .catch(() => {
          this.setState({ error: 'error' });
        });
    }
  };

  const declineReserved = async () => {
    if (!confirm(`Are you sure you want to decline iris.to/${name}?`)) {
      return;
    }
    const pubkey = Key.getPubKey();
    const event: Partial<Event> = {
      content: `decline iris.to/${name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Events.getEventHash(event as UnsignedEvent);
    event.sig = await Key.sign(event as UnsignedEvent);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/decline_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status === 200) {
      this.setState({ confirmSuccess: false, error: null, existing: null });
    } else {
      res
        .json()
        .then((json) => {
          this.setState({ error: json.message || 'error' });
        })
        .catch(() => {
          this.setState({ error: 'error' });
        });
    }
  };

  return (
    <div>
      <p className="text-iris-green">
        Username iris.to/<b>{name}</b> is reserved for you!
      </p>
      <AccountName name={name} link={false} />
      <p>
        <button className="btn btn-sm btn-primary" onClick={() => enableReserved()}>
          Yes please
        </button>
      </p>
      <p>
        <button className="btn btn-sm btn-neutral" onClick={() => declineReserved()}>
          No thanks
        </button>
      </p>
    </div>
  );
}
