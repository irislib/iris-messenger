import {html} from '../Helpers.js';
import {AVAILABLE_LANGUAGES, language} from '../Translation.js';
import Translations from '../Translations.js';

function onLanguageChange(e) {
  const l = $(e.target).val();
  if (AVAILABLE_LANGUAGES.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}

const LanguageSelector = () => html`
  <select class="language-selector" onChange=${e => onLanguageChange(e)} value=${language}>${
    AVAILABLE_LANGUAGES.map(l =>
      html`<option value=${l}>${Translations[l].language_name}</option>`
    )
  }</select>
`;

export default LanguageSelector;
