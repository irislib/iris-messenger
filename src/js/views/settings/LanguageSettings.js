import {AVAILABLE_LANGUAGES, AVAILABLE_LANGUAGE_KEYS, language, translate as t} from '../../translations/Translation';
import $ from 'jquery';
import { Fragment } from 'preact';

  const LanguageSettings = () => {
    return (
        <>
        <div class="centered-container">
        <h3>{t('language')}</h3>
        <div class="centered-container">
        {
          Object.keys(AVAILABLE_LANGUAGES).map(l => {
            let inputl = "";
            if(l == language){
              inputl = <input type="radio" name="language" id={l} onChange={e => onLanguageChange(e)} value={l} checked />;
            }else{
              inputl = <input type="radio" name="language" id={l} onChange={e => onLanguageChange(e)} value={l} />;
            }
           return(
              <Fragment key={l} >
                {inputl}
                <label for={l}>{AVAILABLE_LANGUAGES[l]}</label>
                <br />
              </Fragment >
           );
           
          }
          )
        }
        </div>

        </div>
        </>
    );
}

function onLanguageChange(e) {
  const l = $(e.target).val();
  if (AVAILABLE_LANGUAGE_KEYS.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}
export default LanguageSettings;