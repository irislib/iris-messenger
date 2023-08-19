import debounce from 'lodash/debounce';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import { RouteProps } from '@/views/types.ts';

import Upload from '../../components/buttons/Upload.tsx';
import Header from '../../components/Header.tsx';
import SafeImg from '../../components/SafeImg.tsx';
import Key from '../../nostr/Key.ts';
import SocialNetwork from '../../nostr/SocialNetwork.ts';
import { translate as t } from '../../translations/Translation.mjs';

const explainers = {
  lud16: 'Bitcoin lightning address ⚡ (lud16)',
  picture: 'Picture url',
  banner: 'Banner url',
  nip05: 'Nostr address (nip05)',
};

const EditProfile: React.FC<RouteProps> = () => {
  const [profile, setProfile] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    return SocialNetwork.getProfile(Key.getPubKey(), (p) => {
      if (!edited && Object.keys(profile).length === 0) {
        delete p['created_at'];
        setProfile(p);
      }
    });
  }, [profile, edited]);

  const saveOnChange = debounce(() => {
    const trimmedProfile = { ...profile };
    Object.keys(trimmedProfile).forEach((key) => {
      if (typeof trimmedProfile[key] === 'string') {
        trimmedProfile[key] = trimmedProfile[key].trim();
      }
    });
    SocialNetwork.setMetadata(trimmedProfile);
  }, 2000);

  const setProfileAttribute = (key, value) => {
    key = key.trim();
    const updatedProfile = { ...profile };
    if (value) {
      updatedProfile[key] = value;
    } else {
      delete updatedProfile[key];
    }
    setProfile(updatedProfile);
    setEdited(true);
    saveOnChange();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    SocialNetwork.setMetadata(profile);
    const myPub = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    route('/' + myPub);
  };

  const handleAddField = (event) => {
    event.preventDefault();
    if (newFieldName && newFieldValue) {
      setProfileAttribute(newFieldName, newFieldValue);
      setNewFieldName('');
      setNewFieldValue('');
      SocialNetwork.setMetadata(profile);
    }
  };

  const fields = ['name', 'picture', 'about', 'banner', 'website', 'lud16', 'nip05'];
  Object.keys(profile).forEach((key) => {
    if (!fields.includes(key)) {
      fields.push(key);
    }
  });

  return (
    <>
      <Header />
      <div class="mx-2 md:mx-4">
        <div class="centered-container prose">
          <h3>{t('edit_profile')}</h3>
          <form onSubmit={handleSubmit}>
            {fields.map((field) => {
              const val = profile[field];
              const isString = typeof val === 'string' || typeof val === 'undefined';
              return (
                <p>
                  <label htmlFor={field}>{explainers[field] || field}:</label>
                  <br />
                  <input
                    className="input w-full"
                    type="text"
                    id={field}
                    disabled={!isString}
                    value={isString ? val || '' : JSON.stringify(val)}
                    onInput={(e: any) => isString && setProfileAttribute(field, e.target.value)}
                  />
                  {field === 'lud16' && !val && (
                    <p>
                      <small>{t('install_lightning_wallet_prompt')}</small>
                    </p>
                  )}
                  {(field === 'picture' || field === 'banner') && (
                    <>
                      <p>
                        <Upload onUrl={(url) => setProfileAttribute(field, url)} />
                      </p>
                      {val && (
                        <p>
                          <SafeImg key={val} src={val} />
                        </p>
                      )}
                    </>
                  )}
                </p>
              );
            })}
            <p>
              <button className="btn btn-primary" type="submit">
                Save
              </button>
            </p>
          </form>

          <h4>Add new field</h4>
          <form onSubmit={handleAddField}>
            <p>
              <label htmlFor="newFieldName">Field name:</label>
              <br />
              <input
                value={newFieldName}
                type="text"
                id="newFieldName"
                className="input w-full"
                placeholder={t('field_name')}
                onInput={(e: any) => setNewFieldName(e.target.value)}
              />
            </p>
            <p>
              <label htmlFor="newFieldValue">Field value:</label>
              <br />
              <input
                value={newFieldValue}
                type="text"
                id="newFieldValue"
                className="input w-full"
                placeholder={t('field_value')}
                onInput={(e: any) => setNewFieldValue(e.target.value)}
              />
            </p>
            <p>
              <button className="btn btn-primary" type="submit">
                Add new attribute
              </button>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
