import { html } from 'htm/preact';
import _ from 'lodash';
import Component from '../../BaseComponent';
import {ExistingAccountLogin} from '../Login';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';
import State from '../../State';
import Session from '../../Session';
//import { BrowserRouter as Router, Route, Link } from "react-router-dom";

export default class BlockedSettings extends Component {
  constructor() {
    super();
    this.state = Session.DEFAULT_SETTINGS;
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = "settings";
  }
  render() {
    const blockedUsers = _.filter(Object.keys(this.state.blockedUsers), user => this.state.blockedUsers[user]);
    
    return (
        <>
        <div class="centered-container">
        <h3>{t('blocked_users')}</h3>
        {blockedUsers.map(user => {
          if (this.state.blockedUsers[user]) {
            return html`<p><a href="/profile/${encodeURIComponent(user)}"><${Text} user=${user} path="profile/name" placeholder="User"/></a></p>`;
          }
        })}
        {blockedUsers.length === 0 ? t('none') : ''}
        </div>
        </>
    );
  }
}