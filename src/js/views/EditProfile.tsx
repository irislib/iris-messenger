import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import Button from '../components/basic/Button';
import Header from '../components/Header';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

export default class EditProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: {},
      name: '',
      picture: '',
      about: '',
      lud16: '',
      website: '',
    };
  }

  componentDidMount() {
    let loaded = false;
    Nostr.getProfile(iris.session.getKey().secp256k1.rpub, (p) => {
      console.log('profile', p);
      if (!loaded) {
        loaded = true;
        this.setState({
          name: p.name,
          picture: p.picture,
          about: p.about,
          lud16: p.lud16,
          website: p.website,
          profile: p,
        });
      }
    });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const updatedProfile = Object.assign(this.state.profile, {
      name: this.state.name,
      picture: this.state.picture,
      about: this.state.about,
      lud16: this.state.lud16,
      website: this.state.website,
    });
    Nostr.setMetadata(updatedProfile);
    const myPub = Nostr.toNostrBech32Address(iris.session.getKey().secp256k1.rpub, 'npub');
    route('/profile/' + myPub);
  };

  render() {
    return (
      <>
        <Header />
        <div class="main-view" id="settings">
          <div class="centered-container" style="width: 650px;padding: 15px;">
            <h3>{t('edit_profile')}</h3>
            <form onSubmit={this.handleSubmit}>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={this.state.name}
                onInput={(e) => this.setState({ name: e.target.value })}
              />
              <br />
              <label htmlFor="picture">Picture:</label>
              <input
                type="text"
                id="picture"
                value={this.state.picture}
                onInput={(e) => this.setState({ picture: e.target.value })}
              />
              <br />
              <label htmlFor="about">About:</label>
              <textarea
                id="about"
                value={this.state.about}
                onInput={(e) => this.setState({ about: e.target.value })}
              />
              <br />
              <label htmlFor="lud16">Lightning (lud16):</label>
              <input
                type="text"
                id="lud16"
                value={this.state.lud16}
                onInput={(e) => this.setState({ lud16: e.target.value })}
              />
              <br />
              <label htmlFor="website">Website:</label>
              <input
                type="text"
                id="website"
                value={this.state.website}
                onInput={(e) => this.setState({ website: e.target.value })}
              />
              <br />
              <Button type="submit">Save</Button>
            </form>
          </div>
        </div>
      </>
    );
  }
}
