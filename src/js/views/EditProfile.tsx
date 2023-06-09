import { debounce } from 'lodash';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import { PrimaryButton as Button } from '../components/buttons/Button';
import Upload from '../components/buttons/Upload';
import Header from '../components/Header';
import SafeImg from '../components/SafeImg';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

const explainers = {
  lud16: 'Bitcoin lightning address ⚡ (lud16)',
  picture: 'Picture url',
  banner: 'Banner url',
  nip05: 'Nostr address (nip05)',
};

export default class EditProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: {},
      newFieldName: '',
      newFieldValue: '',
      edited: false,
    };
  }

  componentDidMount() {
    SocialNetwork.getProfile(Key.getPubKey(), (p) => {
      if (!this.state.edited && Object.keys(this.state.profile).length === 0) {
        delete p['created_at'];
        this.setState({
          profile: p,
        });
      }
    });
  }

  saveOnChange = debounce(() => {
    const profile = this.state.profile;
    Object.keys(profile).forEach((key) => {
      if (typeof profile[key] === 'string') {
        profile[key] = profile[key].trim();
      }
    });
    SocialNetwork.setMetadata(profile);
  }, 2000);

  setProfileAttribute = (key, value) => {
    key = key.trim();
    const profile = Object.assign({}, this.state.profile);
    if (value) {
      profile[key] = value;
    } else {
      delete profile[key];
    }
    this.setState({ profile, edited: true });
    this.saveOnChange();
  };

  handleSubmit = (event) => {
    event.preventDefault();
    SocialNetwork.setMetadata(this.state.profile);
    const myPub = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    route('/' + myPub);
  };

  handleAddField = (event) => {
    event.preventDefault();
    const fieldName = this.state.newFieldName;
    const fieldValue = this.state.newFieldValue;
    if (fieldName && fieldValue) {
      this.setProfileAttribute(fieldName, fieldValue);
      this.setState({ newFieldName: '', newFieldValue: '' });
      SocialNetwork.setMetadata(this.state.profile);
    }
  };

  render() {
    const fields = ['name', 'picture', 'about', 'banner', 'website', 'lud16', 'nip05'];
    // add other possible fields from profile
    Object.keys(this.state.profile).forEach((key) => {
      if (!fields.includes(key)) {
        fields.push(key);
      }
    });

    return (
      <>
        <Header />
        <div class="main-view" id="settings">
          <div class="centered-container" style="width: 650px;padding: 15px;">
            <h3>{t('edit_profile')}</h3>
            <form onSubmit={(e) => this.handleSubmit(e)}>
              {fields.map((field) => {
                const val = this.state.profile[field];
                const isString = typeof val === 'string' || typeof val === 'undefined';
                return (
                  <p>
                    <label htmlFor={field}>{explainers[field] || field}:</label>
                    <br />
                    <input
                      style={{ 'margin-top': '5px', width: '100%' }}
                      type="text"
                      id={field}
                      disabled={!isString}
                      value={isString ? val || '' : JSON.stringify(val)}
                      onInput={(e) =>
                        isString &&
                        this.setProfileAttribute(field, (e.target as HTMLInputElement).value)
                      }
                    />
                    {field === 'lud16' && !val && (
                      <p>
                        <small>{t('install_lightning_wallet_prompt')}</small>
                      </p>
                    )}
                    {field === 'picture' || field === 'banner' ? (
                      <>
                        <p>
                          <Upload onUrl={(url) => this.setProfileAttribute(field, url)} />
                        </p>
                        {val && (
                          <p>
                            <SafeImg src={val} />
                          </p>
                        )}
                      </>
                    ) : null}
                  </p>
                );
              })}
              <p>
                <Button type="submit">Save</Button>
              </p>
            </form>

            <h4>Add new field</h4>
            <form onSubmit={(e) => this.handleAddField(e)}>
              <p>
                <label htmlFor="newFieldName">Field name:</label>
                <br />
                <input
                  value={this.state.newFieldName}
                  type="text"
                  id="newFieldName"
                  style={{ 'margin-top': '5px', width: '100%' }}
                  onInput={(e) =>
                    this.setState({
                      newFieldName: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </p>
              <p>
                <label htmlFor="newFieldValue">Field value:</label>
                <br />
                <input
                  value={this.state.newFieldValue}
                  type="text"
                  id="newFieldValue"
                  style={{ 'margin-top': '5px', width: '100%' }}
                  onInput={(e) =>
                    this.setState({
                      newFieldValue: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </p>
              <p>
                <Button type="submit">Add new attribute</Button>
              </p>
            </form>
          </div>
        </div>
      </>
    );
  }
}
