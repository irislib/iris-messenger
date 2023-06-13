import $ from 'jquery';

import Icons from '../Icons';
import {
  AVAILABLE_LANGUAGE_KEYS,
  AVAILABLE_LANGUAGES,
  language,
} from '../translations/Translation.mjs';

function onLanguageChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  const l = $(target).val();
  if (AVAILABLE_LANGUAGE_KEYS.indexOf(l as string) >= 0) {
    localStorage.setItem('language', l as string);
    location.reload();
  }
}

const LanguageSelector = () => (
  <div className="flex flex-row w-full justify-center items-center">
    {Icons.language}
    <select className="input rounded-full" onChange={(e) => onLanguageChange(e)} value={language}>
      {Object.keys(AVAILABLE_LANGUAGES).map((l) => (
        <option value={l}>{AVAILABLE_LANGUAGES[l]}</option>
      ))}
    </select>
  </div>
);

export default LanguageSelector;
