import Dexie, { Table } from 'dexie';
import { EdgeRecord } from '../model/Graph';
import ProfileRecord from '../model/ProfileRecord';


export const DB_NAME = 'DWoTR';

export class DWoTRDexie extends Dexie {
  // 'vertices' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  //vertices!: Table<Vertice>; 
  edges!: Table<EdgeRecord>;
  profiles!: Table<ProfileRecord>;

  constructor() {
    super(DB_NAME);


    // this.version(1).stores({
    //   vertices: '++id, key', // Primary key and indexed props
    //   edges: '++id', // Primary key and indexed props
    //   profiles: '++id, key'
    // });

    this.version(2).stores({
      edges: 'key, outKey, inKey', // Primary key is a hash of the outKey and inKey, type and context
      profiles: 'key'
    });
  }
}
let dwotrDB = new DWoTRDexie();  

// dwotrDB.open().then(() => {
//   console.log('Database opened version:', dwotrDB.verno);
//   if (dwotrDB.verno <= 4) { // Checking the database version
//     dwotrDB.delete().then(() => {
//       // Recreate the database here
//       console.log('Database deleted version:', dwotrDB.verno);
//       dwotrDB.open().then(() => {
//         console.log('Database opened version:', dwotrDB.verno);
//       });
//     }
//     );
//   }
// });

export default dwotrDB;

export function resetWoTDatabase() {
  return dwotrDB.transaction('rw', dwotrDB.edges, dwotrDB.profiles, async () => {
    await Promise.all(dwotrDB.tables.map(table => table.clear()));
  });
}