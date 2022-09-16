import State from '../State';
import Identicon from '../components/Identicon';
import Filters from '../components/Filters';
import {translate as t} from '../translations/Translation';
import FollowButton from '../components/FollowButton';
import Name from '../components/Name';
import View from './View';
import Session from '../Session';
import ScrollViewport from 'preact-scroll-viewport';
import _ from 'lodash';

// TODO: add group selector
class Contacts extends View {
  state = {sortedKeys: []};
  id = "contacts-view";
  contacts = {};

  updateSortedKeys() {
    const sortedKeys = Object.keys(this.contacts).sort((aK,bK) => {
      const a = this.contacts[aK];
      const b = this.contacts[bK];
      if (!a.name && !b.name) return aK.localeCompare(bK);
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    _.remove(sortedKeys, k => k === Session.getPubKey());
    this.setState({sortedKeys});
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    let contactsSub;
    State.local.get('filters').get('group').on(this.sub(group => {
      this.contacts = {};
      State.local.get('groups').get(group).on(this.sub((contacts,k,x,e) => {
        contactsSub && contactsSub.off();
        contactsSub = e;
        this.contacts = contacts;
        this.updateSortedKeys();
      }));
    }));

    State.electron && State.electron.get('bonjour').on(s => {
      const nearbyUsers = JSON.parse(s);
      console.log('nearbyUsers', nearbyUsers);
      this.setState({nearbyUsers});
    });
  }

  renderNearbyUsers() {
    return this.state.nearbyUsers.map(peer => {
      const k = peer.txt && peer.txt.user;
      if (!k) { return (<p>{peer.name}</p>); }
      return (
        <div class="profile-link-container">
          {k ? (
            <div class="">
              <a href={`/profile/${k}`} class="profile-link">
                <Identicon key="i{k}" str={k} width={49} />
                <div>
                  <Name key="k{k}" pub={k} /><br />
                  <small class="follower-count">
                      {peer.name}<br />
                      {this.contacts[k] && this.contacts[k].followers && this.contacts[k].followers.size || '0'} {t('followers')}
                  </small>
                </div>
              </a>
              {(k !== Session.getPubKey()) ? (<FollowButton key="f{k}" id={k} />) : ''}
            </div>
          ):''}
        </div>
      );
    });
  }

  renderView() {
    const keys = this.state.sortedKeys;
    if (keys.length === 0 && !this.state.nearbyUsers) {
      return (
      <div class="centered-container">
        <Filters /><br />
        {t('no_contacts_in_list')}
      </div>)
    }

    return (
      <div class="centered-container">
        <div id="contacts-list">
          {(this.state.nearbyUsers) ? (
              <>
                <h3>Nearby users</h3>
                {this.renderNearbyUsers()}
                {this.state.nearbyUsers.length === 0 ? (<p>—</p>) : ''}
                <hr /><br />
                <h3>Others</h3>
              </>
          ):''}
          <Filters /><br />
          <ScrollViewport>
            {keys.map(k => {
              const contact = this.contacts[k];
              return (
              <div key={k} class="profile-link-container">
                <a href={`/profile/${k}`} class="profile-link">
                  <Identicon key={`i${k}`} str={k} width={49} />
                  <div>
                    <Name key={`k${k}`} pub={k} /><br />
                    <small class="follower-count">{contact.followerCount || '0'} {t('followers')}</small>
                  </div>
                </a>
                {k !== Session.getPubKey() ? (<FollowButton key={`f${k}`} id={k} />) : ''}
              </div>);
            })}
          </ScrollViewport>
          {keys.length === 0 ? '—' : ''}
        </div>
      </div>
    );
  }
}

export default Contacts;
