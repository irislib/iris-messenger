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
      newFieldName: '',
      newFieldValue: '',
    };
  }

  componentDidMount() {
    Nostr.getProfile(iris.session.getKey().secp256k1.rpub, (p) => {
      if (Object.keys(this.state.profile).length === 0) {
        delete p['created_at'];
        this.setState({
          profile: p,
        });
      }
    });
  }

  setProfileAttribute = (key, value) => {
    const profile = this.state.profile;
    if (value) {
      profile[key] = value;
    } else {
      delete profile[key];
    }
    this.setState({ profile });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    Nostr.setMetadata(this.state.profile);
    const myPub = Nostr.toNostrBech32Address(iris.session.getKey().secp256k1.rpub, 'npub');
    route('/profile/' + myPub);
  };

  handleAddField = (event) => {
    event.preventDefault();
    const fieldName = this.state.newFieldName;
    const fieldValue = this.state.newFieldValue;
    if (fieldName && fieldValue) {
      this.setProfileAttribute(fieldName, fieldValue);
      this.setState({ newFieldName: '', newFieldValue: '' });
    }
  };

  render() {
    const fields = ['name', 'picture', 'about', 'website', 'lud16'];
    // add other possible fields from profile
    Object.keys(this.state.profile).forEach((key) => {
      if (!fields.includes(key)) {
        fields.push(key);
      }
    });
    const explainers = {
      lud16: 'Lightning (lud16)',
    };

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
                    this.setState({ newFieldName: (e.target as HTMLInputElement).value })
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
                    this.setState({ newFieldValue: (e.target as HTMLInputElement).value })
                  }
                />
              </p>
              <Button type="submit">Add new attribute</Button>
            </form>
          </div>
        </div>
      </>
    );
  }
}
