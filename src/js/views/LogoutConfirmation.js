import { html } from 'htm/preact';
import Session from '../Session.js';
import {translate as t} from '../Translation.js';
import { route } from 'preact-router';

const LogoutConfirmation = () => html`<div class="main-view" id="logout-confirmation">
  <div class="centered-container">
    <p dangerouslySetInnerHTML=${{ __html: t('logout_confirmation_info')}}></p>
    <p>
      <button onClick=${() => route('/settings')}>${t('back')}</button>
    </p>
    <p>
      <button class="logout-button" onClick=${() => Session.logOut()}>${t('log_out')}</button>
    </p>
  </div>
</div>`;

export default LogoutConfirmation;
