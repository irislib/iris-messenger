import fs from 'fs';

import { AVAILABLE_LANGUAGE_KEYS } from '../src/js/translations/Translation.mjs';

// Create a csv file where each row is a translation key and the column is the translation in different languages.
// The file is created in the current working directory.
// The file name is "translations.csv".

// TODO: read translations from .mjs files in ../src/js/translations/

async function translationsToCsv() {
  let csv = '';
  let languages = [];
  let translationKeys = [];
  let translations = {};

  for (let lang of AVAILABLE_LANGUAGE_KEYS) {
    const translation = (await import(`../src/js/translations/${lang}.mjs`)).default;
    translations[lang] = translation;
    languages.push(lang);
    for (let key in translation) {
      if (translationKeys.indexOf(key) === -1) {
        translationKeys.push(key);
      }
    }
  }

  languages.sort();
  translationKeys.sort();

  // add language names to csv
  csv += '"","';
  for (let i = 0; i < languages.length; i++) {
    csv += languages[i];
    if (i < languages.length - 1) {
      csv += '","';
    } else {
      csv += '"\n';
    }
  }

  csv += '"';
  for (let key of translationKeys) {
    let row = key;
    for (let lang of languages) {
      row += '","' + (translations[lang][key] || '').replace(/"/g, '""');
    }
    csv += row + '"\n';
    if (key !== translationKeys[translationKeys.length - 1]) {
      csv += '"';
    }
  }

  // output csv to file
  fs.writeFileSync('translations.csv', csv);
  console.log('wrote translations.csv');
}

// convert the csv back to Translations.mjs in the same format as the original Translations.mjs file
function csvToTranslations() {
  // TODO: work in progress
  let csv = fs.readFileSync('translations.csv', 'utf8');
  let lines = csv.split('\n');
  let translations = {};
  let languages = lines[0].split(',');
  languages.shift();
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].split(',');
    let key = line[0];
    line.shift();
    for (let j = 0; j < languages.length; j++) {
      translations[key][languages[j]] = line[j] || null;
    }
  }
}

translationsToCsv();
