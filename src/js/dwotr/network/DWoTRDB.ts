import Dexie, { Table } from 'dexie';
import { EdgeRecord, Vertice } from '../model/Graph';
import ProfileRecord from '../model/ProfileRecord';

export class DWoTRDexie extends Dexie {
  // 'vertices' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  vertices!: Table<Vertice>; 
  edges!: Table<EdgeRecord>;
  profiles!: Table<ProfileRecord>;

  constructor() {
    super('DWoTR');
    this.version(2).stores({
      //vertices: '++id, key', // Primary key and indexed props
      edges: 'key, outKey, inKey', // Primary key is a hash of the outKey and inKey, type and context
      profiles: 'key'
    });
  }

}

const dwotrDB = new DWoTRDexie();
export default dwotrDB;

export function resetWoTDatabase() {
  return dwotrDB.transaction('rw', dwotrDB.vertices, dwotrDB.edges, dwotrDB.profiles, async () => {
    await Promise.all(dwotrDB.tables.map(table => table.clear()));
  });
}