import { Fragment } from 'preact';

import {
  AVAILABLE_LANGUAGE_KEYS,
  AVAILABLE_LANGUAGES,
  language,
  translate as t,
} from '../../translations/Translation';

const Language = () => {
  return (
    <>
      <div class="centered-container">
        <h3>{t('language')}</h3>
        <div class="centered-container">
          {Object.keys(AVAILABLE_LANGUAGES).map((l) => {
            let input;
            if (l == language) {
              input = (
                <input
                  type="radio"
                  name="language"
                  id={l}
                  onChange={(e) => onLanguageChange(e)}
                  value={l}
                  checked
                />
              );
            } else {
              input = (
                <input
                  type="radio"
                  name="language"
                  id={l}
                  onChange={(e) => onLanguageChange(e)}
                  value={l}
                />
              );
            }
            return (
              <Fragment key={l}>
                {input}
                <label for={l}>{AVAILABLE_LANGUAGES[l]}</label>
                <br />
              </Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

function onLanguageChange(e) {
  const l = e.target.value;
  if (AVAILABLE_LANGUAGE_KEYS.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}
export default Language;
