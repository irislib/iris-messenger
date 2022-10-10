import iris from 'iris-lib';
import Identicon from '../components/Identicon';
import Filters from '../components/Filters';
import {translate as t} from '../translations/Translation';
import FollowButton from '../components/FollowButton';
import Name from '../components/Name';
import View from './View';
import _ from 'lodash';

// TODO: add group selector
class Contacts extends View {
  state = {sortedKeys: [], nearbyUsers: null, group: null, allContacts: {}};
  id = "contacts-view";
  shownContacts = {};
  allContacts = {};

  updateSortedKeys() {
    const sortedKeys = Object.keys(this.shownContacts).sort((aK,bK) => {
      const a = this.allContacts[aK];
      const b = this.allContacts[bK];
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      if (this.state.group === 'everyone') {
        // sort by followers
        if (a.followerCount !== b.followerCount) {
          return (b.followerCount || 0) - (a.followerCount || 0);
        }
      }
      if (!a.name && !b.name) return aK.localeCompare(bK);
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    if (this.state.group !== 'everyone') {
      _.remove(sortedKeys, k => k === iris.session.getPubKey());
    }
    this.setState({sortedKeys});
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    this.contactsSub && this.contactsSub.off();
    iris.local().get('contacts').map(this.sub((contact, k) => {
      this.allContacts[k] = contact;
      this.setState({allContacts: this.allContacts});
      this.updateSortedKeys();
    }));
    iris.local().get('filters').get('group').on(this.sub(group => {
      if (group === this.state.group) return;
      this.shownContacts = {};
      this.setState({group});
      iris.local().get('groups').get(group).on(this.sub((contacts,k,x,e) => {
        this.contactsSub && this.contactsSub.off();
        this.contactsSub = e;
        this.shownContacts = contacts;
        for (let k in this.shownContacts) { // remove some invalid keys. TODO: why are they there?
          if ((k.indexOf('~') === 0) || (k.length < 40)) {
            delete this.shownContacts[k];
          }
        }
        this.updateSortedKeys();
      }));
    }));

    iris.electron && iris.electron.get('bonjour').on(s => {
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
                      {this.shownContacts[k] && this.shownContacts[k].followers && this.shownContacts[k].followers.size || '0'} {t('followers')}
                  </small>
                </div>
              </a>
              {(k !== iris.session.getPubKey()) ? (<FollowButton key="f{k}" id={k} />) : ''}
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
          {keys.map(k => {
            const contact = this.state.allContacts[k] || {};
            return (
            <div key={k} class="profile-link-container">
              <a href={`/profile/${k}`} class="profile-link">
                <Identicon key={`i${k}`} str={k} width={49} />
                <div>
                  <Name key={`k${k}`} pub={k} /><br />
                  <small class="follower-count">{contact.followerCount || '0'} {t('followers')}</small>
                </div>
              </a>
              {(this.state.group !== 'follows' && k !== iris.session.getPubKey()) ? (<FollowButton key={`f${k}`} id={k} />) : ''}
            </div>);
          })}
          {keys.length === 0 ? '—' : ''}
        </div>
      </div>
    );
  }
}

export default Contacts;
