import fs from 'fs';

// Read the csv file with translations
let csv = fs.readFileSync('translations.csv', 'utf8');
let lines = csv.split('\n');

// Get the list of available languages
let languages = lines[0].split(',').map((l) => l.replace(/"/g, '').trim());
languages.shift();

// Create an object to store the translations
let translations = {};

// Regular expression to handle commas within quoted strings
const re = /(?!\B"[^"]*),(?![^"]*"\B)/;

// Iterate through the csv lines and add the translations to the `translations` object
for (let i = 1; i < lines.length; i++) {
  let line = lines[i].split(re);
  let key = line[0].replace(/"/g, '');
  line.shift();
  for (let j = 0; j < languages.length; j++) {
    if (!translations[languages[j]]) {
      translations[languages[j]] = {};
    }
    if (line[j]) {
      translations[languages[j]][key] = line[j].replace(/"/g, '').trim() || null;
    }
  }
}

// Write the translations back to the language files
for (let lang in translations) {
  let fileContent = `export default ${JSON.stringify(translations[lang], null, 2)};`;
  fs.writeFileSync(`../src/js/translations/${lang}.mjs`, fileContent);
}

console.log('Translations added successfully.');
