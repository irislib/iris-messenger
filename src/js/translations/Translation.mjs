import english from './en.mjs';
import React from "react";

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
  he: 'עברית',
  'cs-CZ': 'Čeština',
  'lt': 'Lietuvių',
  'bg': 'Български',
  'id': 'Indonesia',
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
      components.push(React.createElement("b", { key: components.length }, part.slice(3, -4)));
    } else if (part.startsWith("<a>")) {
      components.push(
        React.createElement(
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
