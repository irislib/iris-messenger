import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Button from '../../components/basic/Button';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';

export default class IrisAccountSettings extends Component {
  state = {
    irisToActive: false,
  };

  render() {
    return (
      <>
        <div class="centered-container">
          <h3>{t('iris_account')}</h3>
          <p>
            {this.state.irisToActive ? (
              <div className="positive">{this.state.profile.nip05}</div>
            ) : (
              ''
            )}
            {!this.state.irisToActive && this.state.accountReserved ? (
              <div>
                <p className="positive">
                  Username iris.to/<b>{this.state.profile.name}</b> is reserved for you until
                  2023-03-05!
                </p>
                <p>
                  <Button onClick={() => this.enableReserved()}>Enable</Button>
                </p>
                <p>
                  <Button onClick={() => this.declineReserved()}>Decline</Button>
                </p>
              </div>
            ) : (
              ''
            )}
            {this.state.confirmSuccess ? (
              <div>
                <p className="positive">
                  iris.to/<b>{this.state.profile.name}</b> is now active!
                </p>
                <Button onClick={() => this.setAsPrimary()}>
                  Set as primary Nostr address (nip05)
                </Button>
              </div>
            ) : (
              ''
            )}
            {this.state.confirmError ? (
              <div className="negative">Error: {this.state.confirmError}</div>
            ) : (
              ''
            )}
          </p>
        </div>
      </>
    );
  }

  setAsPrimary() {
    Nostr.getProfile(iris.session.getKey().secp256k1.rpub, (p) => {
      const newNip = this.state.profile.name + '@iris.to';
      if (p) {
        if (p.nip05 !== newNip) {
          p.nip05 = this.state.profile.name + '@iris.to';
          Nostr.setMetadata(this.state.profile);
        } else {
          route('/' + this.state.profile.name);
        }
      }
    });
  }

  async enableReserved() {
    const pubkey = iris.session.getKey().secp256k1.rpub;
    const event = {
      content: `iris.to/${this.state.profile.name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Nostr.getEventHash(event);
    event.sig = await Nostr.sign(event);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/confirm_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status === 200) {
      this.setState({ confirmSuccess: true, confirmError: null, accountReserved: false });
    } else {
      this.setState({ confirmError: JSON.stringify(res) });
    }
  }

  async declineReserved() {
    if (!confirm(`Are you sure you want to decline iris.to/${this.state.profile.name}?`)) {
      return;
    }
    const pubkey = iris.session.getKey().secp256k1.rpub;
    const event = {
      content: `decline iris.to/${this.state.profile.name}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Nostr.getEventHash(event);
    event.sig = await Nostr.sign(event);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/decline_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status === 200) {
      this.setState({ confirmSuccess: false, confirmError: null, accountReserved: false });
    } else {
      this.setState({ confirmError: JSON.stringify(res) });
    }
  }

  componentDidMount() {
    const myPub = iris.session.getKey().secp256k1.rpub;
    Nostr.getProfile(
      myPub,
      (profile) => {
        const irisToActive =
          profile && profile.nip05 && profile.nip05valid && profile.nip05.endsWith('@iris.to');
        console.log(profile, irisToActive);
        this.setState({ profile, irisToActive });
        if (!irisToActive && profile.name) {
          this.checkAccountReserved(profile.name, myPub);
        }
      },
      true,
    );
  }

  async checkAccountReserved(name, pub) {
    // make a get request to https://api.iris.to/user/username_confirmable?name=${name}&public_key=${pub}
    // if the response is 200, then the account is available

    const res = await fetch(
      `https://api.iris.to/user/username_confirmable?name=${name.toLowerCase()}&public_key=${pub}`,
    );
    if (res.status === 200) {
      this.setState({ accountReserved: true });
    }
  }
}
