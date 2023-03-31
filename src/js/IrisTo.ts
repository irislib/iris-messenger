import { Event } from './lib/nostr-tools';
import Events from './nostr/Events';
import Key from './nostr/Key';
import SocialNetwork from './nostr/SocialNetwork';
import localState from './LocalState';

export default {
  async checkExistingAccount(pub) {
    if (!['iris.to', 'beta.iris.to', 'localhost'].includes(window.location.hostname)) {
      return;
    }
    // get username linked to pub along with its user_confirmed status
    const res = await fetch(`https://api.iris.to/user/find?public_key=${pub}`);
    if (res.status === 200) {
      const json = await res.json();
      console.log('existingIrisToAddress', json);
      localState.get('existingIrisToAddress').put(json);
      const timeout = setTimeout(() => {
        if (!json?.confirmed) {
          localState.get('showNoIrisToAddress').put(true);
        }
      }, 1000);
      localState.get('showNoIrisToAddress').on((show) => {
        if (show) {
          clearTimeout(timeout);
        }
      });
      return { existing: json };
    }
    const timeout = setTimeout(() => {
      localState.get('showNoIrisToAddress').put(true);
    }, 2000);
    localState.get('showNoIrisToAddress').on((show) => {
      if (!show) {
        clearTimeout(timeout);
      }
    });
  },

  setAsPrimary(name) {
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
        }
      }
      this.setState({ profile: p, irisToActive: true });
    });
  },

  async enableReserved(name) {
    const pubkey = Key.getPubKey();
    const event: Event = {
      content: `iris.to/${name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Events.getEventHash(event);
    event.sig = (await Key.sign(event)) as string;
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/confirm_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    // should perhaps be in the next block, but users are having cache issues. this may help.
    localState.get('showNoIrisToAddress').put(false);
    localState.get('existingIrisToAddress').put({ confirmed: true, name });
    if (res.status === 200) {
      return { error: null, existing: { confirmed: true, name } };
    } else {
      res
        .json()
        .then((json) => {
          return { error: json.message || 'error' };
        })
        .catch(() => {
          return { error: 'error' };
        });
    }
  },

  async declineReserved(name) {
    if (!confirm(`Are you sure you want to decline iris.to/${name}?`)) {
      return;
    }
    const pubkey = Key.getPubKey();
    const event: Event = {
      content: `decline iris.to/${name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Events.getEventHash(event);
    event.sig = (await Key.sign(event)) as string;
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/decline_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status === 200) {
      localState.get('showNoIrisToAddress').put(false);
      localState.get('existingIrisToAddress').put(null);
      return { confirmSuccess: false, error: null, existing: null };
    } else {
      res
        .json()
        .then((json) => {
          return { error: json.message || 'error' };
        })
        .catch(() => {
          return { error: 'error' };
        });
    }
  },
};
