import Dexie, { Table } from 'dexie';
import { Edge, Vertice } from './Graph';

export class WoTDexie extends Dexie {
  // 'vertices' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  vertices!: Table<Vertice>; 
  edges!: Table<Edge>;

  constructor() {
    super('DWoTR');
    this.version(1).stores({
      vertices: '++id, key', // Primary key and indexed props
      edges: '++id' // Primary key and indexed props
    });
  }

}

const wotDB = new WoTDexie();
export default wotDB;

export function resetWoTDatabase() {
  return wotDB.transaction('rw', wotDB.vertices, wotDB.edges, async () => {
    await Promise.all(wotDB.tables.map(table => table.clear()));
  });
}