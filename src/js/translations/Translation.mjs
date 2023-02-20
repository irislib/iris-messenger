import english from './en.mjs';
import { createElement } from "preact";

const AVAILABLE_LANGUAGES = {
  en: 'English',
  'zh-cn': '简体中文',
  es: 'Español',
  ru: 'Русский',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  id: 'Indonesia',
  'pt-BR': 'Português (Brasil)',
  tr: 'Türkçe',
  vt: 'Tiếng Việt',
  bn: 'বাংলা',
  th: 'ไทย',
  hi: 'हिन्दी',
  fa: 'فارسی',
  ur: 'اردو',
  hu: 'Magyar',
  sk: 'Slovenčina',
  nl: 'Nederlands',
  he: 'עברית',
  fi: 'Suomi',
  'cs-CZ': 'Čeština',
  'bg': 'Български',
  'lt': 'Lietuvių',
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
  const text = (k && (translation[k] || capitalize(k.replace(/_/g, ' '))));
  const parts = text.split(/(<b>.*?<\/b>|<a>.*?<\/a>)/);
  const components = [];

  parts.forEach(part => {
    if (part.startsWith("<b>")) {
      components.push(createElement("b", { key: components.length }, part.slice(3, -4)));
    } else if (part.startsWith("<a>")) {
      components.push(
        createElement(
          "a",
          { key: components.length, ...linkProps },
          part.slice(3, -4)
        )
      );
    } else {
      components.push(part);
    }
  });

  return components.length === 1 ? components[0] : components;
}


export { translate, translationLoaded, AVAILABLE_LANGUAGES, AVAILABLE_LANGUAGE_KEYS, language };
