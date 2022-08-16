import {AVAILABLE_LANGUAGES, language, translate as t} from '../../Translation';
import Translations from '../../Translations';
import $ from 'jquery';

//export default class LanguageSettings extends Component {
  const LanguageSettings = () => {
    return (
        <>
        <div class="centered-container">
        <h3>{t('language')}</h3>
        <div class="centered-container">
        {
          AVAILABLE_LANGUAGES.map(l => {
            let inputl = null;
            if(l == {language}.language){
              inputl = <input type="radio" name="language" id={l} onChange={e => onLanguageChange(e)} value={l} checked />;
            }else{
              inputl = <input type="radio" name="language" id={l} onChange={e => onLanguageChange(e)} value={l} />;
            }
           return(
            <>
              {inputl}
              <label for={l}>{Translations[l].language_name}</label>
              <br />
            </>
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
  if (AVAILABLE_LANGUAGES.indexOf(l) >= 0) {
    localStorage.setItem('language', l);
    location.reload();
  }
}
export default LanguageSettings;