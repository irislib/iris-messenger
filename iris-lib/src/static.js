import publicSpace from './public';
import util from './util';

export default {
  get(hash, callback) {
    return new Promise((resolve, reject) => {
      if (!hash) {
        reject('No hash provided');
      }
      if (typeof hash !== 'string') {
        reject('Hash must be a string');
      }
      publicSpace().get('#').get(hash).on((v, k, x, e) => {
        if (v) {
          e.off();
          callback && callback(v);
          resolve(v);
        }
      });
    });
  },

  async put(value) {
    const hash = await util.getHash(value);
    publicSpace().get('#').get(hash).put(value);
    return hash;
  }
}