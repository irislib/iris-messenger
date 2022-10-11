import publicSpace from './global';
import util from './util';

/**
 * Content-addressed storage
 */
export default {
  /**
   * Get a file identified by its hash
   * @param hash
   * @param callback
   * @returns {Promise<unknown>}
   */
  get(hash: string, callback: Function) {
    return new Promise((resolve, reject) => {
      if (!hash) {
        reject('No hash provided');
      }
      if (typeof hash !== 'string') {
        reject('Hash must be a string');
      }
      publicSpace().get('#').get(hash).on((v: any, _k: string, _x: any, e: any) => {
        if (v) {
          e.off();
          callback && callback(v);
          resolve(v);
        }
      });
    });
  },

  /**
   * Store a file and return its hash
   * @param value
   * @returns {Promise<string>}
   */
  async put(value: any) {
    const hash = await util.getHash(value);
    publicSpace().get('#').get(hash).put(value);
    return hash;
  }
}