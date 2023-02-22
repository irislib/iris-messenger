import iris from 'iris-lib';
import { debounce } from 'lodash';
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
    let view = '';

    if (this.state.irisToActive) {
      view = <div className="positive">{this.state.profile.nip05}</div>;
    } else if (this.state.haveAccount) {
      view = (
        <div>
          <div className="negative">You have an active iris.to account</div>
          <Button onClick={() => this.setAsPrimary()}>Set as primary</Button>
        </div>
      );
    } else if (this.state.accountReserved) {
      view = (
        <div>
          <p className="positive">
            Username iris.to/<b>{this.state.profile.name}</b> is reserved for you until 2023-03-05!
          </p>
          <p>
            <Button onClick={() => this.enableReserved()}>Enable</Button>
          </p>
          <p>
            <Button onClick={() => this.declineReserved()}>Decline</Button>
          </p>
        </div>
      );
    } else if (this.state.confirmSuccess) {
      view = (
        <div>
          <p className="positive">
            iris.to/<b>{this.state.profile.name}</b> is now active!
          </p>
          <Button onClick={() => this.setAsPrimary()}>Set as primary Nostr address (nip05)</Button>
        </div>
      );
    } else if (this.state.confirmError) {
      view = <div className="negative">Error: {this.state.confirmError}</div>;
    } else {
      view = (
        <div>
          <p>Register an Iris username (iris.to/username)</p>
          <form onSubmit={(e) => this.register(e)}>
            <input
              type="text"
              placeholder="Username"
              value={this.state.newUserName}
              onInput={(e) => this.onNewUserNameChange(e)}
            />
            <Button type="submit" enabled={this.state.newUserNameValid}>
              Register
            </Button>
            <p>
              {this.state.newUserNameValid ? (
                <span className="positive">Username is available</span>
              ) : (
                <span className="negative">{this.state.invalidUsernameMessage}</span>
              )}
            </p>
          </form>
        </div>
      );
    }

    return (
      <>
        <div class="centered-container">
          <h3>{t('iris_account')}</h3>
          {view}
        </div>
      </>
    );
  }

  async onNewUserNameChange(e) {
    const newUserName = e.target.value;
    if (newUserName.length === 0) {
      this.setState({ newUserName, newUserNameValid: false, invalidUsernameMessage: '' });
      return;
    }
    if (newUserName.length < 4 || newUserName.length > 15) {
      this.setState({
        newUserName,
        newUserNameValid: false,
        invalidUsernameMessage: 'Username must be between 4 and 15 characters',
      });
      return;
    }
    if (!newUserName.match(/^[a-z0-9]+$/)) {
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

  async register(e) {
    e.preventDefault();
    if (!this.state.newUserNameValid) {
      return;
    }
    const pubkey = iris.session.getKey().secp256k1.rpub;
    const event = {
      content: `iris.to/${this.state.newUserName}`,
      kind: 1,
      tags: [],
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
    };
    event.id = Nostr.getEventHash(event);
    event.sig = await Nostr.sign(event);
    // post signed event as request body to https://api.iris.to/user/confirm_user
    const res = await fetch('https://api.iris.to/user/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (res.status === 200) {
      this.setState({
        confirmSuccess: true,
        confirmError: null,
        accountReserved: false,
        haveAccount: true,
      });
    } else {
      this.setState({ confirmError: JSON.stringify(res) });
    }
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

  async checkAccountAvailable(name) {
    const res = await fetch(`https://api.iris.to/user/available?name=${name.toLowerCase()}`);
    if (res.status === 200) {
      this.setState({ accountAvailable: true });
    }
  }
}
