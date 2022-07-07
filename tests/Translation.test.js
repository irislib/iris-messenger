import { AVAILABLE_LANGUAGES, translate } from '../src/js/Translation';

console.log('hello from test');

describe('Translation', () => {
  describe('AVAILABLE_LANGUAGES', () => {
    it('should include English', () => {
      expect(AVAILABLE_LANGUAGES).toContain('en');
    });
  });

  describe('translate', () => {
    it('should translate language_name', () => {
      localStorage.setItem('language', 'es')
      expect(translate('language_name')).toBe('English');
    });

    // TODO: update the API of Translation.js so that we can test with other
    // languages (it is currently fixed to 'en')
  });
});
