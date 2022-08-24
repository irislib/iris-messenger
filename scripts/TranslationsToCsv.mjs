import Translations from "../src/js/Translations.mjs";
import fs from "fs";

// Create a csv file where each row is a translation key and the column is the translation in different languages.
// The file is created in the current working directory.
// The file name is "translations.csv".

let csv = '';
let languages = [];
let translationKeys = [];

for (let lang in Translations) {
    languages.push(lang);
    for (let key in Translations[lang]) {
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
        row += '","' + (Translations[lang][key] || '');
    }
    csv += row + '"\n"';
}

// output csv to file
fs.writeFileSync('translations.csv', csv);