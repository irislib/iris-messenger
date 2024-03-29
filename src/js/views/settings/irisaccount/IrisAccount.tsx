import debounce from 'lodash/debounce';
import { Event, UnsignedEvent } from 'nostr-tools';
import { Component } from 'preact';

import localState from '@/state/LocalState.ts';
import AccountName from '@/views/settings/irisaccount/AccountName.tsx';
import ActiveAccount from '@/views/settings/irisaccount/ActiveAccount.tsx';
import ReservedAccount from '@/views/settings/irisaccount/ReservedAccount.tsx';

import Events from '../../../nostr/Events.ts';
import Key from '../../../nostr/Key.ts';
import SocialNetwork from '../../../nostr/SocialNetwork.ts';

declare global {
  interface Window {
    cf_turnstile_callback: any;
  }
}

// TODO split into smaller components
export default class IrisAccount extends Component {
  state = {
    irisToActive: false,
    existing: null as any,
    profile: null as any,
    newUserName: '',
    newUserNameValid: false,
    error: null as any,
    showChallenge: false,
    invalidUsernameMessage: null as any,
  };

  render() {
    let view: any;

    if (this.state.irisToActive) {
      const username = this.state.profile.nip05.split('@')[0];
      view = <AccountName name={username} />;
    } else if (this.state.existing && this.state.existing.confirmed) {
      view = (
        <ActiveAccount
          name={this.state.existing.name}
          setAsPrimary={() => this.setState({ irisToActive: true })}
        />
      );
    } else if (this.state.existing) {
      view = (
        <ReservedAccount
          name={this.state.existing.name}
          enableReserved={() => this.enableReserved()}
          declineReserved={() => this.declineReserved()}
        />
      );
    } else if (this.state.error) {
      view = <div className="text-iris-red">Error: {this.state.error}</div>;
    } else if (this.state.showChallenge) {
      window.cf_turnstile_callback = (token) => this.register(token);
      view = (
        <>
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
          <div
            className="cf-turnstile"
            data-sitekey={
              ['iris.to', 'beta.iris.to'].includes(window.location.hostname)
                ? '0x4AAAAAAACsEd8XuwpPTFwz'
                : '3x00000000000000000000FF'
            }
            data-callback="cf_turnstile_callback"
          ></div>
        </>
      );
    } else {
      view = (
        <div>
          <p>Register an Iris username (iris.to/username)</p>
          <form onSubmit={(e) => this.showChallenge(e)}>
            <div className="flex gap-2">
              <input
                className="input"
                type="text"
                placeholder="Username"
                value={this.state.newUserName}
                onInput={(e) => this.onNewUserNameChange(e)}
              />
              <button className="btn btn-primary" type="submit">
                Register
              </button>
            </div>
            <p>
              {this.state.newUserNameValid ? (
                <>
                  <span className="text-iris-green">Username is available</span>
                  <AccountName name={this.state.newUserName} link={false} />
                </>
              ) : (
                <span className="text-iris-red">{this.state.invalidUsernameMessage}</span>
              )}
            </p>
          </form>
        </div>
      );
    }

    return (
      <>
        <h3>Iris.to account</h3>
        {view}
        <p>
          <a href="https://github.com/irislib/faq#iris-username">FAQ</a>
        </p>
      </>
    );
  }

  async onNewUserNameChange(e) {
    const newUserName = e.target.value;
    if (newUserName.length === 0) {
      this.setState({
        newUserName,
        newUserNameValid: false,
        invalidUsernameMessage: '',
      });
      return;
    }
    if (newUserName.length < 8 || newUserName.length > 15) {
      this.setState({
        newUserName,
        newUserNameValid: false,
        invalidUsernameMessage: 'Username must be between 8 and 15 characters',
      });
      return;
    }
    if (!newUserName.match(/^[a-z0-9_.]+$/)) {
      this.setState({
        newUserName,
        newUserNameValid: false,
        invalidUsernameMessage: 'Username must only contain lowercase letters and numbers',
      });
      return;
    }
    this.setState({
      newUserName,
      invalidUsernameMessage: '',
    });
    this.checkAvailabilityFromAPI(newUserName);
  }

  checkAvailabilityFromAPI = debounce(async (name) => {
    const res = await fetch(`https://api.iris.to/user/available?name=${encodeURIComponent(name)}`);
    if (name !== this.state.newUserName) {
      return;
    }
    if (res.status < 500) {
      const json = await res.json();
      if (json.available) {
        this.setState({ newUserNameValid: true });
      } else {
        this.setState({
          newUserNameValid: false,
          invalidUsernameMessage: json.message,
        });
      }
    } else {
      this.setState({
        newUserNameValid: false,
        invalidUsernameMessage: 'Error checking username availability',
      });
    }
  }, 500);

  showChallenge(e) {
    e.preventDefault();
    if (!this.state.newUserNameValid) {
      return;
    }
    this.setState({ showChallenge: true });
  }

  async register(cfToken) {
    console.log('register', cfToken);
    const pubkey = Key.getPubKey();
    const event: any = {
      content: `iris.to/${this.state.newUserName}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Events.getEventHash(event);
    event.sig = await Key.sign(event);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, cfToken }),
    });
    if (res.status === 200) {
      this.setState({
        error: null,
        existing: {
          confirmed: true,
          name: this.state.newUserName,
        },
      });
      delete window.cf_turnstile_callback;
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
  }

  async enableReserved() {
    const pubkey = Key.getPubKey();
    const event: any = {
      content: `iris.to/${this.state.existing.name}`,
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
    localState
      .get('existingIrisToAddress')
      .put({ confirmed: true, name: this.state.existing.name });
    if (res.status === 200) {
      this.setState({
        error: null,
        existing: { confirmed: true, name: this.state.existing.name },
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
  }

  async declineReserved() {
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
  }

  componentDidMount() {
    const myPub = Key.getPubKey();
    SocialNetwork.getProfile(
      myPub,
      (profile) => {
        const irisToActive =
          profile && profile.nip05 && profile.nip05valid && profile.nip05.endsWith('@iris.to');
        this.setState({ profile, irisToActive });
        if (profile && !irisToActive) {
          this.checkExistingAccount(myPub);
        }
      },
      true,
    );
    this.checkExistingAccount(myPub);
  }

  async checkExistingAccount(pub) {
    const res = await fetch(`https://api.iris.to/user/find?public_key=${pub}`);
    if (res.status === 200) {
      const json = await res.json();
      this.setState({ existing: json });
    }
  }
}
