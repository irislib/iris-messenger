import Dexie, { Table } from 'dexie';
import { Edge, Vertice } from '../model/Graph';
import ProfileRecord from '../model/ProfileRecord';

export class WoTDexie extends Dexie {
  // 'vertices' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  vertices!: Table<Vertice>; 
  edges!: Table<Edge>;
  profiles!: Table<ProfileRecord>;

  constructor() {
    super('DWoTR');
    this.version(1).stores({
      vertices: '++id, key', // Primary key and indexed props
      edges: '++id', // Primary key and indexed props
      profiles: '++id, key'
    });
  }

}

const wotDB = new WoTDexie();
export default wotDB;

export function resetWoTDatabase() {
  return wotDB.transaction('rw', wotDB.vertices, wotDB.edges, wotDB.profiles, async () => {
    await Promise.all(wotDB.tables.map(table => table.clear()));
  });
}