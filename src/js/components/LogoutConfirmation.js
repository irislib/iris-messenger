import { html } from '../Helpers.js';
import {localState} from '../Main.js';
import Session from '../Session.js';
import {translate as t} from '../Translation.js';

const LogoutConfirmation = () => html`<div class="main-view" id="logout-confirmation">
  <p dangerouslySetInnerHTML=${{ __html: t('logout_confirmation_info')}}></p>
  <p>
    <button onClick=${() => localState.get('activeRoute').put('settings')}>${t('back')}</button>
  </p>
  <p>
    <button class="logout-button" onClick=${() => Session.logOut()}>${t('log_out')}</button>
  </p>
</div>`;

export default LogoutConfirmation;
