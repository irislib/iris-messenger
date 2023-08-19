import { LanguageIcon } from '@heroicons/react/24/solid';

import {
  AVAILABLE_LANGUAGE_KEYS,
  AVAILABLE_LANGUAGES,
  language,
} from '../../translations/Translation.mjs';

function onLanguageChange(e): void {
  const selectedLanguage = e.target.value;
  if (AVAILABLE_LANGUAGE_KEYS.includes(selectedLanguage)) {
    localStorage.setItem('language', selectedLanguage);
    location.reload();
  }
}

const LanguageSelector = () => (
  <div className="flex flex-row w-full justify-center items-center">
    <LanguageIcon width={24} />
    <select className="input rounded-full" onChange={onLanguageChange} value={language}>
      {Object.keys(AVAILABLE_LANGUAGES).map((l) => (
        <option key={l} value={l}>
          {AVAILABLE_LANGUAGES[l]}
        </option>
      ))}
    </select>
  </div>
);

export default LanguageSelector;
