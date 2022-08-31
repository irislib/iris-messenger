import { html } from 'htm/preact';
import {AVAILABLE_LANGUAGES, AVAILABLE_LANGUAGE_KEYS, language} from '../translations/Translation';
import $ from 'jquery';
import Icons from '../Icons';

function onLanguageChange(e) {
  const l = $(e.target).val();
  if (AVAILABLE_LANGUAGE_KEYS.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}

const LanguageSelector = () => html`
  ${Icons.language}
  <select class="language-selector" onChange=${e => onLanguageChange(e)} value=${language}>${
    Object.keys(AVAILABLE_LANGUAGES).map(l =>
      html`<option value=${l}>${AVAILABLE_LANGUAGES[l]}</option>`
    )
  }</select>
`;

export default LanguageSelector;
