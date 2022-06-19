import { html } from 'htm/preact';
import {AVAILABLE_LANGUAGES, language} from '../Translation';
import Translations from '../Translations';
import $ from 'jquery';
import Icons from '../Icons';

function onLanguageChange(e) {
  const l = $(e.target).val();
  if (AVAILABLE_LANGUAGES.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}

const LanguageSelector = () => html`
  ${Icons.language}
  <select class="language-selector" onChange=${e => onLanguageChange(e)} value=${language}>${
    AVAILABLE_LANGUAGES.map(l =>
      html`<option value=${l}>${Translations[l].language_name}</option>`
    )
  }</select>
`;

export default LanguageSelector;
