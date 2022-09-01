import { AVAILABLE_LANGUAGE_KEYS, translate } from '../src/js/translations/Translation';

console.log('hello from test');

describe('Translation', () => {
  describe('AVAILABLE_LANGUAGES', () => {
    it('should include English', () => {
      expect(AVAILABLE_LANGUAGE_KEYS).toContain('en');
    });
  });

  describe('translate', () => {
    it('should translate language_name', () => {
      localStorage.setItem('language', 'en')
      expect(translate('new_user_go')).toBe('Go');
    });

    // TODO: update the API of Translation.js so that we can test with other
    // languages (it is currently fixed to 'en')
  });
});
