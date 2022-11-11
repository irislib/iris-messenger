import english from './en.mjs';

const AVAILABLE_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ru: 'Русский',
  'pt-BR': 'Português (Brasil)',
  fi: 'Suomi',
  ur: 'اردو',
  'zh-cn': '简体中文',
  ko: '한국어',
};

let AVAILABLE_LANGUAGE_KEYS = Object.keys(AVAILABLE_LANGUAGES);

let language;
let translation;
let translationLoaded;

// if not node.js
if (typeof module !== 'undefined') {
  language = localStorage.getItem('language') || navigator.language || 'en';
  if (AVAILABLE_LANGUAGE_KEYS.indexOf(language) === -1) {
    const s = language.slice(0, 2);
    language = 'en';
    for (let i = 0; i < AVAILABLE_LANGUAGE_KEYS.length; i++) {
      if (AVAILABLE_LANGUAGE_KEYS[i].slice(0, 2) === s) {
        language = AVAILABLE_LANGUAGE_KEYS[i];
        break;
      }
    }
  }

  translationLoaded = import(`./${language}.mjs`).then((module) => {
    translation = module.default;
    if (language !== 'en') {
      translation = { ...english, ...translation };
    }
  });
}

function capitalize(s) {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function translate(k, linkProps) {
  return (
    k && (translation[k] || capitalize(k.replace(/_/g, ' '))).replace('<a', `<a ${linkProps || ''}`)
  );
}

export { translate, translationLoaded, AVAILABLE_LANGUAGES, AVAILABLE_LANGUAGE_KEYS, language };
