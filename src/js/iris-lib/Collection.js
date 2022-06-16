import Gun from 'gun'; // eslint-disable-line no-unused-vars
// eslint-disable-line no-unused-vars

/**
* Gun object collection that provides tools for indexing and search. Decentralize everything!
*
* If opt.class is passed, object.serialize() and opt.class.deserialize() must be defined.
*
* Supports search from multiple indexes.
* For example, retrieve message feed from your own index and your friends' indexes.
*
* TODO: aggregation
* TODO: example
* TODO: scrollable and stretchable "search result window"
* @param {Object} opt {gun, class, indexes = [], askPeers = true, name = class.name}
*/
class Collection {
  constructor(opt = {}) {
    if (!opt.gun) {
      throw new Error(`Missing opt.gun`);
    }
    if (!(opt.class || opt.name)) {
      throw new Error(`You must supply either opt.name or opt.class`);
    }
    this.class = opt.class;
    this.serializer = opt.serializer;
    if (this.class && !this.class.deserialize && !this.serializer) {
      throw new Error(`opt.class must have deserialize() method or opt.serializer must be defined`);
    }
    this.name = opt.name || opt.class.name;
    this.gun = opt.gun;
    this.indexes = opt.indexes || [];
    this.indexer = opt.indexer;
    this.askPeers = typeof opt.askPeers === `undefined` ? true : opt.askPeers;
  }

  /**
  * @return {String} id of added object, which can be used for collection.get(id)
  */
  put(object, opt = {}) {
    let data = object;
    if (this.serializer) {
      data = this.serializer.serialize(object);
    } if (this.class) {
      data = object.serialize();
    }
    // TODO: optionally use gun hash table
    let node;
    if (opt.id || data.id) {
      node = this.gun.get(this.name).get(`id`).get(opt.id || data.id).put(data); // TODO: use .top()
    } else if (object.getId) {
      node = this.gun.get(this.name).get(`id`).get(object.getId()).put(data);
    } else {
      node = this.gun.get(this.name).get(`id`).set(data);
    }
    this._addToIndexes(data, node);
    return data.id || Gun.node.soul(node) || node._.link;
  }

  async _addToIndexes(serializedObject, node) {
    if (Gun.node.is(serializedObject)) {
      serializedObject = await serializedObject.open();
    }
    const addToIndex = (indexName, indexKey) => {
      this.gun.get(this.name).get(indexName).get(indexKey).put(node);
    };
    if (this.indexer) {
      const customIndexes = await this.indexer(serializedObject);
      const customIndexKeys = Object.keys(customIndexes);
      for (let i = 0;i < customIndexKeys;i++) {
        const key = customIndexKeys[i];
        addToIndex(key, customIndexes[key]);
      }
    }
    for (let i = 0;i < this.indexes.length; i++) {
      const indexName = this.indexes[i];
      if (Object.prototype.hasOwnProperty.call(serializedObject, indexName)) {
        addToIndex(indexName, serializedObject[indexName]);
      }
    }
  }


  // TODO: method for terminating the query
  // TODO: query ttl. https://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html
  /**
  * @param {Object} opt {callback, id, selector, limit, orderBy}
  */
  get(opt = {}) {
    if (!opt.callback) { return; }
    let results = 0;
    const matcher = (data, id, node) => {
      if (!data) { return; }
      if (opt.limit && results++ >= opt.limit) {
        return; // TODO: terminate query
      }
      if (opt.selector) { // TODO: deep compare selector object?
        const keys = Object.keys(opt.selector);
        for (let i = 0;i < keys.length;i++) {
          const key = keys[i];
          if (!Object.prototype.hasOwnProperty.call(data, key)) { return; }
          let v1, v2;
          if (opt.caseSensitive === false) {
            v1 = data[key].toLowerCase();
            v2 = opt.selector[key].toLowerCase();
          } else {
            v1 = data[key];
            v2 = opt.selector[key];
          }
          if (v1 !== v2) { return; }
        }
      }
      if (opt.query) { // TODO: use gun.get() lt / gt operators
        const keys = Object.keys(opt.query);
        for (let i = 0;i < keys.length;i++) {
          const key = keys[i];
          if (!Object.prototype.hasOwnProperty.call(data, key)) { return; }
          let v1, v2;
          if (opt.caseSensitive === false) {
            v1 = data[key].toLowerCase();
            v2 = opt.query[key].toLowerCase();
          } else {
            v1 = data[key];
            v2 = opt.query[key];
          }
          if (v1.indexOf(v2) !== 0) { return; }
        }
      }
      if (this.serializer) {
        opt.callback(this.serializer.deserialize(data, {id, gun: node.$}));
      } else if (this.class) {
        opt.callback(this.class.deserialize(data, {id, gun: node.$}));
      } else {
        opt.callback(data);
      }
    };

    if (opt.id) {
      opt.limit = 1;
      this.gun.get(this.name).get(`id`).get(opt.id).on(matcher);
      return;
    }

    let indexName = `id`;
    if (opt.orderBy && this.indexes.indexOf(opt.orderBy) > -1) {
      indexName = opt.orderBy;
    }

    // TODO: query from indexes
    this.gun.get(this.name).get(indexName).map().on(matcher); // TODO: limit .open recursion
    if (this.askPeers) {
      this.gun.get(`trustedIndexes`).on((val, key) => {
        this.gun.user(key).get(this.name).get(indexName).map().on(matcher);
      });
    }
  }

  delete() {
    // gun.unset()
  }
}

export default Collection;
