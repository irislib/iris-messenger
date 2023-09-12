import LocalStorageMemoryAdapter from '@/state/LocalStorageMemoryAdapter.ts';

import Node from './Node';

const localState = new Node({ id: 'localState', adapters: [new LocalStorageMemoryAdapter()] });

export default localState;
