const Collection = require(`Collection.js`);
const Gun = require(`gun`);
const open = require(`gun/lib/open`);
const radix = require(`gun/lib/radix`); // Require before instantiating Gun, if running in jsdom mode

class Animal {
  constructor(name, species) {
    if (!name || name.length === 0) { throw new Error(`Invalid name`); }
    if (!species || species.length === 0) { throw new Error(`Invalid species`); }
    this.name = name;
    this.species = species;
  }

  serialize() {
    return {name: this.name, species: this.species};
  }

  static deserialize(data) {
    return new Animal(data.name, data.species);
  }
}

describe(`Collection`, () => {
  let gun, animals, n = 0;
  beforeAll(() => {
    gun = new Gun({radisk: false});
    const indexer = animal => {
      const reversedName = animal.name.split(``).reverse().join(``).toLowerCase();
      return {reversedName};
    };
    animals = new Collection({gun, class: Animal, indexes: ['name', 'species'], indexer});
  });
  test(`put`, () => {
    animals.put(new Animal('Moisture', 'cat'));n++;
    animals.put(new Animal('Petard', 'cat'));n++;
    animals.put(new Animal('Petunia', 'cat'));n++;
    animals.put(new Animal('Petrol', 'cat'));n++;
    animals.put(new Animal('Parsley', 'cat'));n++;
    animals.put(new Animal('proton', 'cat'));n++;
    animals.put(new Animal('Oilbag', 'cat'));n++;
    animals.put(new Animal('Scumbag', 'dog'));n++;
    animals.put(new Animal('Deadbolt', 'parrot'));n++;
    animals.put(new Animal('Moisture', 'dog'));n++;
  });
  test(`get all`, done => {
    let timesCalled = 0;
    function callback(animal) {
      expect(animal).toBeInstanceOf(Animal);
      timesCalled++;
      if (timesCalled === n) {
        done();
      }
    }
    animals.get({callback});
  });
  test(`search (case sensitive)`, done => {
    let timesCalled = 0;
    function callback(animal) {
      expect(animal).toBeInstanceOf(Animal);
      expect(animal.name.indexOf('P')).toBe(0);
      timesCalled++;
      if (timesCalled === 4) {
        done();
      }
    }
    animals.get({callback, query: {name: 'P'}});
  });
  test(`search (case insensitive)`, done => {
    let timesCalled = 0;
    function callback(animal) {
      expect(animal).toBeInstanceOf(Animal);
      expect(animal.name.toLowerCase().indexOf('p')).toBe(0);
      timesCalled++;
      if (timesCalled === 5) {
        done();
      }
    }
    animals.get({callback, query: {name: 'P'}, caseSensitive: false});
  });
  test(`selector`, done => {
    let timesCalled = 0;
    function callback(animal) {
      expect(animal).toBeInstanceOf(Animal);
      expect(animal.name).toBe(`Moisture`);
      timesCalled++;
      if (timesCalled === 2) {
        done();
      }
    }
    animals.get({callback, selector: {name: 'Moisture'}});
  });
  // TODO: test multiple index search
  // TODO: unique vs non-unique indexes
  // TODO: delete from collection and indexes
});
