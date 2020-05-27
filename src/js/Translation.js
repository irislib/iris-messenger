import Translations from './Translations.js';

var AVAILABLE_LANGUAGES = Object.keys(Translations);
var language = localStorage.getItem('language') || (navigator.language && navigator.language.slice(0,2)) || 'en';
language = AVAILABLE_LANGUAGES.indexOf(language) >= 0 ? language : 'en';
var translation = Translations[language];
if (language !== 'en') {
  var en = Translations['en'];
  Object.keys(en).forEach(k => translation[k] = translation[k] || en[k]);
}

function translate(k) {
  return translation[k] || k;
}

function init() {
  AVAILABLE_LANGUAGES.forEach(l => {
    var el = $('<option>').attr('value', l).text(Translations[l].language_name);
    $('.language-selector').append(el.clone());
  });
  $('.language-selector').val(language);
  $('.language-selector').change(e => {
    var l = $(e.target).val();
    if (AVAILABLE_LANGUAGES.indexOf(l) >= 0) {
      localStorage.setItem('language', l);
      location.reload();
    }
  });
}

export {translate};
export default {translate, translation, AVAILABLE_LANGUAGES, init};
