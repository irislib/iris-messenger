import Dexie from 'dexie';
import { DB_NAME, DWoTRDexie } from './network/DWoTRDexie';

class Storage {
  #db: DWoTRDexie | null = null;
  #deleting = false;

  get profiles() {
    return this.db.profiles;
  }

  get edges() {
    return this.db.edges;
  }

  get db(): DWoTRDexie {
    if (!this.#db) {
      try {
        this.#db = new DWoTRDexie();
        this.#db.open().catch((error) => {
          console.log('Error opening database', error);
          // Delete database and reload
          this.recreateDB();
        });
      } catch (error) {
        // This should only happen if the database is corrupted or the version is wrong
        console.log('Error opening database', error);
        this.recreateDB();
      }
    }
    return this.#db as DWoTRDexie;
  }

  constructor() {}

  // This should only happen if the database is corrupted or the version is wrong
  recreateDB() {
    if (this.#deleting) return;

    this.#deleting = true; // Prevent multiple calls to this function, will never be reset to false as the deletion is only done once

    this.deleteDB().then(() => {
      this.#db = new DWoTRDexie();
    });

    const sleep = (milliseconds: number) => {
      const date = Date.now();
      let currentDate;
      do {
        currentDate = Date.now();
      } while (currentDate - date < milliseconds || !this.#db);
    };

    sleep(5000); // Wait for the DB to be deleted and recreated
  }

  // async resetWoTDatabase() {
  //     if(!this.db) return;
  //     return this.db.transaction('rw', this.db.edges, this.db.profiles, async () => {
  //         await Promise.all(this.db.tables.map(table => table.clear()));
  //     });
  // }

  async deleteDB() {
    let exists = await Dexie.exists(DB_NAME);
    if (!exists) return;

    await Dexie.delete(DB_NAME);
    console.log('Database deleted');
  }
}

const storage = new Storage();

export default storage;
