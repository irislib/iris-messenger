import Translations from './Translations.mjs';

let AVAILABLE_LANGUAGES = Object.keys(Translations);
let language = localStorage.getItem('language') || navigator.language || 'en';
if (AVAILABLE_LANGUAGES.indexOf(language) === -1) {
  const s = language.slice(0,2);
  language = 'en';
  for (let i = 0; i < AVAILABLE_LANGUAGES.length; i++) {
    if (AVAILABLE_LANGUAGES[i].slice(0,2) === s) {
      language = AVAILABLE_LANGUAGES[i];
      break;
    }
  }
}
let translation = Translations[language];
if (language !== 'en') {
  let en = Translations['en'];
  Object.keys(en).forEach(k => translation[k] = translation[k] || en[k]);
}

function capitalize(s: string) {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function translate(k?: string, linkProps?: string) {
  return k && (translation[k] || capitalize(k.replace(/_/g, ' '))).replace('<a', `<a ${linkProps||''}`);
}

export {translate, AVAILABLE_LANGUAGES, language};
export default {translate, translation};
