import Fun from '../src/js/Fun';

describe('Fun', () => {
  describe('Basic API', () => {
    it('should have a constructor', () => {
      const fun = new Fun();
      expect(fun).toBeInstanceOf(Fun);
    });

    describe('once', () => {
      it('should return the saved value', async () => {
        const fun = new Fun();
        fun.get('settings').get('language').put('klingon');
        const value = await fun.get('settings').get('language').once();
        expect(value).toBe('klingon');
      });
    });

    describe('map', () => {
      const test_data = {
        language: 'klingon',
        turboMode: true,
        maxConnections: 10
      };

      it('should return all the saved child values', async () => {
        const fun = new Fun();
        Object.keys(test_data).forEach(key => {
          fun.get('settings').get('local').get(key).put(test_data[key]);
        });
        const seenKeys = new Set();
        await new Promise(resolve => {
          fun.get('settings').get('local').map((value, key, none, event) => {
            expect(value).toBe(test_data[key]);
            expect(event.off).toBeDefined();
            seenKeys.add(key);
            if (seenKeys.size === Object.keys(test_data).length) {
              resolve();
            }
          });
        });
      });

      it('should subscribe to changes in child values', async () => {
        const fun = new Fun();
        const seenKeys = new Set();
        setTimeout(() => {
          Object.keys(test_data).forEach(key => {
            fun.get('settings').get('local').get(key).put(test_data[key]);
          });
        }, 10);
        await new Promise(resolve => {
          fun.get('settings').get('local').map((value, key, none, event) => {
            expect(value).toBe(test_data[key]);
            expect(event.off).toBeDefined();
            seenKeys.add(key);
            if (seenKeys.size === Object.keys(test_data).length) {
              resolve();
            }
          });
        });
      });

      it('should not chain .map() callback too far back', async () => {
        const fun = new Fun();
        const mockCallback = jest.fn();
        fun.get('settings').map(mockCallback);
        const localCalled = new Promise(resolve => {
          fun.get('settings').get('local').map(resolve);
        });
        fun.get('settings').get('local').get('language').put('klingon');
        await localCalled;
        expect(mockCallback).toBeCalledTimes(1);
      });

      it('should chain .map() callback', async () => {
        const fun = new Fun();
        fun.get('contacts').get('id123').put({name: 'John Doe', followerCount: 5});
        await new Promise(resolve => {
          fun.get('contacts').map((value, key) => {
            expect(key).toBe('id123');
            expect(value).toEqual({name: 'John Doe', followerCount: 5});
            resolve();
          });
        });
      });
    });
  });
});