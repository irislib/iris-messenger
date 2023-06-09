import fs from 'fs';
import { glob } from 'glob';
import { AVAILABLE_LANGUAGE_KEYS } from '../src/js/translations/Translation.mjs';

const EXTRA_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'today',
  'yesterday',
  'global_feed',
  'messages',
  'feeds',
  'social_network',
  'content',
  'images',
  'audio',
  'videos',
  'autoplay_videos',
  'playback',
  'embeds',
  'everyone',
];

async function translationsToCsv() {
  let csv = '';
  let languages = [];
  let translationKeys = new Set();
  let translations = {};

  for (let lang of AVAILABLE_LANGUAGE_KEYS) {
    const translation = (await import(`../src/js/translations/${lang}.mjs`)).default;
    translations[lang] = translation;
    languages.push(lang);
  }

  // Collect used translation keys from code
  const files = glob.sync('../src/js/**/*.{js,jsx,ts,tsx}', { ignore: '../src/js/lib/**/*' });
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/(^|[^a-zA-Z])t\(['"`]([^'"`]+)['"`]\)/g);
    if (matches) {
      matches.forEach((match) => {
        const key = match.match(/(^|[^a-zA-Z])t\(['"`]([^'"`]+)['"`]\)/)[2];
        translationKeys.add(key);
      });
    }
  });
  console.log('found', translationKeys.size, 'translation keys from', files.length, 'files');

  // Translation keys from variables are not found by the regex above
  EXTRA_KEYS.forEach((key) => {
    translationKeys.add(key);
  });
  translationKeys = Array.from(translationKeys);
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
      row += '","' + (translations[lang][key] || '')
        .replace(/"/g, '""')
        .replace(/\\/g, '')
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

translationsToCsv();
